"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const ESP32_HOST = process.env.ESP32_HOST || 'http://10.174.204.136';
const ESP32_TIMEOUT_MS = 4000;
const RETRIEVE_TASK_TYPES = new Set(['Retrieve', 'Pick']);
const STORE_TASK_TYPES = new Set(['Store']);
function mapItemToEsp32Color(sku, name) {
    const value = `${sku || ''} ${name || ''}`.toLowerCase();
    if (value.includes('milk') || value.includes('choc-milk') || value.includes('milk chocolate'))
        return 'blue';
    if (value.includes('white') || value.includes('choc-wht') || value.includes('white chocolate'))
        return 'green';
    if (value.includes('dark') || value.includes('choc-dark') || value.includes('dark chocolate'))
        return 'red';
    return null;
}
async function sendEsp32RetrieveCommand(color) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ESP32_TIMEOUT_MS);
    try {
        const response = await fetch(`${ESP32_HOST}/${color}`, { signal: controller.signal });
        const text = await response.text();
        return text.trim() === 'OK_DONE';
    }
    catch (error) {
        return false;
    }
    finally {
        clearTimeout(timeout);
    }
}
// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});
// Error response standardization middleware
app.use((req, res, next) => {
    res.sendError = (status, message, details) => {
        console.error(`[Error] ${status}: ${message}`, details || '');
        res.status(status).json({
            success: false,
            error: message,
            ...(details && { details })
        });
    };
    next();
});
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        req.user = decoded;
        next();
    }
    catch (_error) {
        return res.status(401).json({ success: false, error: 'Session expired' });
    }
}
// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const dbHealthy = await (0, db_1.testConnection)();
        const visionOnline = await checkVisionService();
        const status = dbHealthy ? 200 : 503;
        res.status(status).json({
            success: dbHealthy,
            timestamp: new Date().toISOString(),
            services: {
                database: dbHealthy ? 'online' : 'offline',
                vision: visionOnline ? 'online' : 'offline',
                api: 'online'
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});
// Vision service availability check
async function checkVisionService() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    try {
        const response = await fetch('http://localhost:8001/health', { signal: controller.signal });
        return response.ok;
    }
    catch {
        return false;
    }
    finally {
        clearTimeout(timeout);
    }
}
// -----------------------------------------------------------------------------
// AUTH ENDPOINTS
// -----------------------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('[Auth] Login attempt:', { email, passwordLength: password?.length || 0 });
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
        console.log('[Auth] Missing email or password');
        return res.sendError(400, 'Email and password are required.');
    }
    try {
        console.log('[Auth] Querying user:', normalizedEmail);
        const [users] = await db_1.db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
        console.log('[Auth] Query result:', { found: users?.length > 0, count: users?.length });
        if (!users || users.length === 0) {
            console.log('[Auth] User not found');
            return res.sendError(401, 'Invalid email or password');
        }
        const user = users[0];
        console.log('[Auth] Validating password for user:', user.email);
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        console.log('[Auth] Password valid:', isPasswordValid);
        if (!isPasswordValid) {
            console.log('[Auth] Invalid password');
            return res.sendError(401, 'Invalid email or password');
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET not configured');
            return res.sendError(500, 'Server configuration error');
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '1d' });
        console.log('[Auth] Login successful for:', user.email);
        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (error) {
        console.error('[Auth] Login error:', error);
        res.sendError(500, 'Login failed', error);
    }
});
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db_1.db.query('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1', [req.user?.id]);
        if (!users || users.length === 0) {
            return res.sendError(401, 'Session expired');
        }
        return res.json({ success: true, user: users[0] });
    }
    catch (error) {
        res.sendError(500, 'Failed to validate session', error);
    }
});
// -----------------------------------------------------------------------------
// DATA ENDPOINTS
// -----------------------------------------------------------------------------
app.get('/api/inventory', async (req, res) => {
    try {
        const [rows] = await db_1.db.query(`
      SELECT 
        id,
        sku, 
        name, 
        category, 
        quantity AS stock, 
        capacity, 
        location AS bin, 
        status, 
        updated_at
      FROM inventory_items
      ORDER BY id ASC
    `);
        const processedRows = rows.map((row) => {
            // In SQLite, updated_at is typically stored as a string or timestamp
            const updated = new Date(row.updated_at || Date.now());
            const now = new Date();
            const diffMs = Math.max(0, now.getTime() - updated.getTime());
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);
            let lastUpdated = '';
            if (diffMins < 60)
                lastUpdated = `${diffMins} mins ago`;
            else if (diffHours < 24)
                lastUpdated = `${diffHours} hours ago`;
            else
                lastUpdated = `${diffDays} days ago`;
            return {
                ...row,
                id: String(row.id),
                lastUpdated,
                updated_at: undefined // remove the raw updated_at
            };
        });
        res.json(processedRows); // Return direct array to match mockData
    }
    catch (error) {
        console.error('Failed to load inventory:', error);
        res.status(500).json({ error: 'Failed to load inventory' });
    }
});
app.post('/api/inventory/update-from-vision', async (req, res) => {
    const { item, color, action, timestamp, event_id, source } = req.body;
    try {
        // 1. Record the vision detection
        const detectedAt = timestamp && !Number.isNaN(new Date(timestamp).getTime())
            ? formatToMySQL(new Date(timestamp))
            : formatToMySQL(new Date());
        await db_1.db.query(`INSERT INTO vision_detections (item, color, action, event_id, source, detected_at) 
       VALUES (?, ?, ?, ?, ?, ?)`, [item, color, action || 'pick', event_id, source || 'vision', detectedAt]);
        // 2. Map color to corresponding inventory item SKU
        let itemSku = '';
        if (color === 'blue')
            itemSku = 'CHOC-MILK-01';
        else if (color === 'red')
            itemSku = 'CHOC-DARK-01';
        else if (color === 'green')
            itemSku = 'CHOC-WHT-01';
        if (itemSku) {
            // 3. Find the item to get its ID and current quantity
            const [items] = await db_1.db.query('SELECT id, quantity FROM inventory_items WHERE sku = ? LIMIT 1', [itemSku]);
            if (items && items.length > 0) {
                const itemId = items[0].id;
                // 4. Increment quantity in inventory_items
                await db_1.db.query(`UPDATE inventory_items 
           SET quantity = quantity + 1, 
               status = CASE 
                 WHEN quantity + 1 <= 0 THEN 'Out of Stock' 
                 WHEN quantity + 1 <= 200 THEN 'Low Stock' 
                 ELSE 'In Stock' 
               END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`, [itemId]);
                // 5. Create a completed task immediately (as the arm picks/places in real time)
                const desc = `Picked and sorted ${item || 'chocolate'} via vision system`;
                const duration = `${Math.floor(Math.random() * 5) + 5}s`;
                const [taskInsert] = await db_1.db.query(`INSERT INTO tasks (task_type, description, item_id, quantity, status, progress, robot_id, operator, source, completed_at, confidence)
           VALUES ('Pick', ?, ?, 1, 'Success', 100, 'RBT-01', 'AI', 'vision', CURRENT_TIMESTAMP, ?)`, [desc, itemId, Math.floor(Math.random() * 5) + 95]);
                const taskId = taskInsert.insertId;
                // 6. Log the task action
                await db_1.db.query(`INSERT INTO task_logs (task_id, action, notes)
           VALUES (?, 'completed', 'Picked via vision system')`, [taskId]);
                console.log(`[Vision update] Handled detection: SKU ${itemSku}, Item ID ${itemId}, Task ID ${taskId}`);
            }
        }
        res.json({ success: true });
    }
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT') {
            console.log(`[Vision update] Duplicate event ignored: ${event_id}`);
            return res.json({ success: true, message: 'Duplicate event ignored' });
        }
        console.error('Vision update error:', error);
        res.status(500).json({ error: 'Failed to record vision update' });
    }
});
app.post('/api/tasks', async (req, res) => {
    const { type, taskType, description, product, quantity, assignedRobot, source } = req.body;
    try {
        let itemId = null;
        if (product) {
            const [items] = await db_1.db.query('SELECT id FROM inventory_items WHERE name LIKE ? OR category LIKE ? LIMIT 1', [`%${product}%`, `%${product}%`]);
            if (items && items.length > 0) {
                itemId = items[0].id;
            }
        }
        const effectiveType = taskType || type || 'Pick';
        const robotId = assignedRobot || 'RBT-01';
        const desc = description || `${effectiveType} ${quantity || 12} ${product || 'chocolates'}`;
        const [insertResult] = await db_1.db.query(`INSERT INTO tasks (task_type, description, item_id, quantity, status, progress, robot_id, operator, source)
       VALUES (?, ?, ?, ?, 'Queued', 0, ?, ?, ?)`, [effectiveType, desc, itemId, quantity || 12, robotId, source === 'voice' ? 'AI' : 'Manual', source || 'web']);
        const taskId = insertResult.insertId ? `T-${insertResult.insertId}` : undefined;
        res.json({ success: true, message: 'Task queued successfully', taskId });
    }
    catch (error) {
        console.error('Failed to create task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});
app.get('/api/vision/detections', async (req, res) => {
    try {
        const [rows] = await db_1.db.query(`
      SELECT 
        id, item as object, color, confidence, detected_at as time
      FROM vision_detections
      ORDER BY detected_at DESC
      LIMIT 10
    `);
        const formatted = rows.map((r) => {
            let colorClass = 'bg-status-info';
            if (r.color === 'red')
                colorClass = 'bg-status-danger';
            if (r.color === 'green')
                colorClass = 'bg-status-success';
            if (r.color === 'blue')
                colorClass = 'bg-status-warning';
            const date = new Date(r.time);
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            return {
                time: timeStr,
                object: r.object,
                confidence: r.confidence || 95,
                color: colorClass
            };
        });
        res.json({ success: true, data: formatted });
    }
    catch (error) {
        console.error('Failed to fetch detections:', error);
        res.status(500).json({ error: 'Failed to load detections' });
    }
});
app.get('/api/tasks/active', async (req, res) => {
    try {
        const [rows] = await db_1.db.query(`
      SELECT 
        CONCAT('T-', id) as id,
        description,
        status,
        progress,
        task_type as type
      FROM tasks
      WHERE status NOT IN ('Success', 'Failed')
      ORDER BY created_at DESC
    `);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load active tasks' });
    }
});
app.get('/api/tasks/history', async (req, res) => {
    try {
        const [rows] = await db_1.db.query(`
      SELECT 
        CONCAT('H-', id) as id,
        created_at as timestamp,
        description,
        robot_id as robotId,
        duration,
        status,
        operator,
        confidence
      FROM tasks
      WHERE status IN ('Success', 'Failed')
      ORDER BY created_at DESC
    `);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load task history' });
    }
});
function formatToMySQL(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0') + ' ' +
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0') + ':' +
        String(d.getSeconds()).padStart(2, '0');
}
app.get('/api/dashboard/summary', async (req, res) => {
    try {
        const [distribution] = await db_1.db.query('SELECT category as name, SUM(quantity) as value FROM inventory_items GROUP BY category');
        const [activeRobotTask] = await db_1.db.query("SELECT id, description FROM tasks WHERE status = 'Active' LIMIT 1");
        const robotStatus = activeRobotTask && activeRobotTask.length > 0 ? 'working' : 'idle';
        const systemHealth = [
            { service: 'Database', status: 'online', uptime: '99.9%', ping: '8ms' },
            { service: 'Robotic Arm', status: robotStatus, uptime: '99.8%', ping: '12ms' },
            { service: 'AI Assistant', status: 'idle', uptime: '100%', ping: '150ms' }
        ];
        // Total items sorted today
        const [todayDetections] = await db_1.db.query("SELECT COUNT(*) as count FROM vision_detections WHERE detected_at >= CURDATE()");
        const itemsSorted = todayDetections[0]?.count || 0;
        // Completed tasks today
        const [completedTasks] = await db_1.db.query("SELECT COUNT(*) as count FROM tasks WHERE status = 'Success' AND completed_at >= CURDATE()");
        const tasksCompleted = completedTasks[0]?.count || 0;
        // Active/Pending tasks (for the KPI block)
        const [activeTasksCount] = await db_1.db.query("SELECT COUNT(*) as count FROM tasks WHERE status IN ('Queued', 'Active')");
        const pendingTasks = activeTasksCount[0]?.count || 0;
        // Production throughput in the last hour
        const [throughputHour] = await db_1.db.query("SELECT COUNT(*) as count FROM vision_detections WHERE detected_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)");
        const throughputPerHour = throughputHour[0]?.count || 0;
        // Task success and error rates
        const [taskStats] = await db_1.db.query(`
      SELECT 
        COUNT(*) as totalTasks,
        SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as successTasks
      FROM tasks
      WHERE status IN ('Success', 'Failed') AND created_at >= CURDATE()
    `);
        const total = taskStats[0]?.totalTasks || 0;
        const success = taskStats[0]?.successTasks || 0;
        const successRate = total > 0 ? Math.round((success / total) * 100) : 100;
        const errorRate = total > 0 ? Math.round(((total - success) / total) * 100) : 0;
        // Total inventory value
        const [stockVal] = await db_1.db.query("SELECT SUM(quantity * 500) as totalValue FROM inventory_items");
        const inventoryValue = stockVal[0]?.totalValue || 0;
        // 24-hour throughput buckets (vision_detections per hour)
        const throughputData = [];
        for (let i = 23; i >= 0; i--) {
            const date = new Date(Date.now() - i * 3600000);
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:00`;
            const startHour = new Date(date.getTime());
            startHour.setMinutes(0, 0, 0);
            const endHour = new Date(date.getTime());
            endHour.setMinutes(59, 59, 999);
            const [detCount] = await db_1.db.query('SELECT COUNT(*) as count FROM vision_detections WHERE detected_at BETWEEN ? AND ?', [formatToMySQL(startHour), formatToMySQL(endHour)]);
            throughputData.push({ time: timeStr, value: detCount[0]?.count || 0 });
        }
        const [throughput24hRows] = await db_1.db.query('SELECT COUNT(*) as count FROM vision_detections WHERE detected_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)');
        const throughput24h = throughput24hRows[0]?.count || 0;
        const [topProductRows] = await db_1.db.query(`
      SELECT item, COUNT(*) as cnt FROM vision_detections
      WHERE detected_at >= CURDATE()
      GROUP BY item ORDER BY cnt DESC LIMIT 1
    `);
        const topProduct = topProductRows[0]?.item || 'N/A';
        const [peakRows] = await db_1.db.query(`
      SELECT HOUR(detected_at) as hr, COUNT(*) as cnt FROM vision_detections
      WHERE detected_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY HOUR(detected_at) ORDER BY cnt DESC LIMIT 1
    `);
        const peakHour = peakRows[0]?.hr != null
            ? `${String(peakRows[0].hr).padStart(2, '0')}:00`
            : 'N/A';
        const peakThroughput = peakRows[0]?.cnt || 0;
        const [durationRows] = await db_1.db.query(`
      SELECT duration FROM tasks
      WHERE status = 'Success' AND completed_at >= CURDATE() AND duration IS NOT NULL
    `);
        const durations = durationRows
            .map((r) => parseInt(String(r.duration).replace(/\D/g, ''), 10))
            .filter((n) => !Number.isNaN(n) && n > 0);
        const avgCycleTime = durations.length > 0
            ? `${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)}s`
            : 'N/A';
        const insights = [];
        if (itemsSorted > 0) {
            insights.push(`Vision system sorted ${itemsSorted} item${itemsSorted === 1 ? '' : 's'} today.`);
        }
        if (peakThroughput > 0) {
            insights.push(`Peak hour ${peakHour} reached ${peakThroughput} detections in the last 24h.`);
        }
        if (pendingTasks > 0) {
            insights.push(`${pendingTasks} task${pendingTasks === 1 ? '' : 's'} queued or active.`);
        }
        if (errorRate > 0) {
            insights.push(`Task error rate today is ${errorRate}%.`);
        }
        const dailySummary = {
            tasksCompleted,
            successRate,
            errorRate,
            avgCycleTime,
            itemsSorted,
            inventoryValue,
            pendingTasks,
            throughputPerHour,
            throughput24h,
            topProduct,
            peakHour,
            peakThroughput,
            insights,
        };
        res.json({
            throughputData,
            inventoryDistribution: distribution || [],
            systemHealth,
            dailySummary
        });
    }
    catch (error) {
        console.error('Failed to load summary data:', error);
        res.status(500).json({ error: 'Failed to load summary data' });
    }
});
// -----------------------------------------------------------------------------
// NOTIFICATIONS ENDPOINT
// -----------------------------------------------------------------------------
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db_1.db.query(`
      SELECT 
        id,
        notes as text,
        timestamp as time
      FROM task_logs
      ORDER BY timestamp DESC
      LIMIT 5
    `);
        const processed = rows.map((r) => {
            const date = new Date(r.time);
            const diffMins = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
            let timeStr = 'Just now';
            if (diffMins > 0) {
                if (diffMins < 60)
                    timeStr = `${diffMins}m ago`;
                else if (diffMins < 1440)
                    timeStr = `${Math.floor(diffMins / 60)}h ago`;
                else
                    timeStr = `${Math.floor(diffMins / 1440)}d ago`;
            }
            return {
                id: r.id,
                text: r.text,
                time: timeStr,
                unread: true
            };
        });
        res.json({ success: true, data: processed });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load notifications' });
    }
});
// -----------------------------------------------------------------------------
// SYSTEM SETTINGS & USER MANAGEMENT ENDPOINTS
// -----------------------------------------------------------------------------
app.get('/api/settings', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db_1.db.query('SELECT setting_key, setting_value FROM system_settings');
        const settingsObj = {};
        for (const row of rows) {
            settingsObj[row.setting_key] = row.setting_value;
        }
        res.json({ success: true, settings: settingsObj });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load system settings.' });
    }
});
app.post('/api/settings', authenticateToken, async (req, res) => {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ success: false, error: 'Settings object is required.' });
    }
    try {
        for (const [key, value] of Object.entries(settings)) {
            const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            await db_1.db.query('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, valStr, valStr]);
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Failed to save settings:', error);
        res.status(500).json({ success: false, error: 'Failed to save system settings.' });
    }
});
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db_1.db.query('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
        const processed = rows.map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            role: r.role.charAt(0).toUpperCase() + r.role.slice(1), // Capitalize Role to match frontend (Admin/Operator)
            active: true
        }));
        res.json({ success: true, data: processed });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load users.' });
    }
});
app.post('/api/users', authenticateToken, async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, error: 'All fields are required.' });
    }
    try {
        const hash = await bcryptjs_1.default.hash(password, 10);
        const normalizedRole = role.toLowerCase();
        await db_1.db.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email.trim().toLowerCase(), hash, normalizedRole]);
        res.status(201).json({ success: true });
    }
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'User with this email already exists.' });
        }
        res.status(500).json({ success: false, error: 'Failed to create user.' });
    }
});
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    const userId = req.params.id;
    try {
        await db_1.db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete user.' });
    }
});
app.post('/api/users/:id/reset-password', authenticateToken, async (req, res) => {
    const userId = req.params.id;
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ success: false, error: 'Password is required.' });
    }
    try {
        const hash = await bcryptjs_1.default.hash(password, 10);
        await db_1.db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to reset password.' });
    }
});
app.post('/api/assistant/chat', async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ success: false, error: 'Message is required.' });
    }
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ success: false, error: 'AI service not configured.' });
    }
    try {
        const contextPrompt = `You are the Cacao Assistant for a chocolate warehouse management system. You help operators with:
- Stock levels and inventory queries
- Task creation and robot task management
- Daily summaries and productivity metrics
- Throughput and production analytics
- System health and service status
- Operator guidance and process help

Reply concisely with clear, actionable information. Use bullet points if listing items.`;
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://choco-loop.local',
                'X-Title': 'ChocoLoop Assistant'
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free',
                messages: [
                    { role: 'system', content: contextPrompt },
                    { role: 'user', content: message }
                ],
                max_tokens: 500
            })
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenRouter API error:', response.status, errText);
            return res.status(502).json({ success: false, error: 'AI service unavailable.' });
        }
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();
        if (!reply) {
            return res.status(502).json({ success: false, error: 'Empty response from AI.' });
        }
        res.json({ success: true, text: reply });
    }
    catch (error) {
        console.error('AI assistant error:', error);
        res.status(500).json({ success: false, error: 'AI service error.' });
    }
});
// -----------------------------------------------------------------------------
// BACKGROUND TASK WORKER — processes robot tasks every 3 seconds
// -----------------------------------------------------------------------------
async function processTaskQueue() {
    try {
        // 1. If no active task, pick the oldest queued one
        const [active] = await db_1.db.query("SELECT id FROM tasks WHERE status = 'Active' LIMIT 1");
        if (!active || active.length === 0) {
            // Grab the oldest queued task
            const [queued] = await db_1.db.query("SELECT id FROM tasks WHERE status = 'Queued' ORDER BY created_at ASC LIMIT 1");
            if (queued && queued.length > 0) {
                await db_1.db.query("UPDATE tasks SET status = 'Active', progress = 0, robot_id = 'RBT-01' WHERE id = ?", [queued[0].id]);
                console.log(`[Worker] Task #${queued[0].id} → Active`);
            }
            return; // next tick will increment its progress
        }
        // 2. Increment progress of the active task
        const taskId = active[0].id;
        const [taskRow] = await db_1.db.query("SELECT progress, quantity, item_id, task_type FROM tasks WHERE id = ?", [taskId]);
        if (!taskRow || taskRow.length === 0)
            return;
        const row = taskRow[0];
        const currentProgress = row.progress || 0;
        const quantity = row.quantity || 1;
        const taskType = row.task_type || '';
        const isRetrieve = RETRIEVE_TASK_TYPES.has(taskType);
        const isStore = STORE_TASK_TYPES.has(taskType);
        if (isRetrieve) {
            let itemColor = null;
            if (row.item_id) {
                const [items] = await db_1.db.query('SELECT sku, name FROM inventory_items WHERE id = ? LIMIT 1', [row.item_id]);
                if (items && items.length > 0) {
                    itemColor = mapItemToEsp32Color(items[0].sku, items[0].name);
                }
            }
            if (!itemColor) {
                await db_1.db.query("UPDATE tasks SET status = 'Failed', progress = 0, completed_at = CURRENT_TIMESTAMP, confidence = 0 WHERE id = ?", [taskId]);
                await db_1.db.query('INSERT INTO task_logs (task_id, action, notes) VALUES (?, ?, ?)', [taskId, 'failed', 'Unable to determine ESP32 retrieval endpoint for task item']);
                console.log(`[Worker] Task #${taskId} failed: unknown ESP32 color mapping`);
                return;
            }
            let successCount = 0;
            for (let unit = 1; unit <= quantity; unit += 1) {
                const ok = await sendEsp32RetrieveCommand(itemColor);
                if (!ok) {
                    const partialProgress = Math.round(((unit - 1) / quantity) * 100);
                    await db_1.db.query("UPDATE tasks SET status = 'Failed', progress = ?, completed_at = CURRENT_TIMESTAMP, confidence = 0 WHERE id = ?", [partialProgress, taskId]);
                    await db_1.db.query('INSERT INTO task_logs (task_id, action, notes) VALUES (?, ?, ?)', [taskId, 'failed', `ESP32 retrieval failed on unit ${unit} for ${itemColor}`]);
                    console.log(`[Worker] Task #${taskId} failed on ESP32 ${itemColor} at unit ${unit}`);
                    return;
                }
                successCount += 1;
                const progress = Math.min(100, Math.round((successCount / quantity) * 100));
                await db_1.db.query('UPDATE tasks SET progress = ? WHERE id = ?', [progress, taskId]);
            }
            const duration = `${Math.floor(Math.random() * 8) + 8}s`;
            await db_1.db.query(`UPDATE tasks SET status = 'Success', progress = 100, duration = ?, confidence = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`, [duration, Math.floor(Math.random() * 5) + 95, taskId]);
            console.log(`[Worker] Task #${taskId} → Success (${duration}) via ESP32 retrieval`);
            if (row.item_id) {
                const qty = quantity;
                await db_1.db.query(`UPDATE inventory_items 
           SET quantity = GREATEST(0, quantity - ?),
               status = CASE 
                 WHEN GREATEST(0, quantity - ?) <= 0 THEN 'Out of Stock' 
                 WHEN GREATEST(0, quantity - ?) <= 200 THEN 'Low Stock' 
                 ELSE 'In Stock' 
               END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`, [qty, qty, qty, row.item_id]);
                console.log(`[Worker] Inventory item ${row.item_id} decremented by ${qty}`);
            }
            return;
        }
        const newProgress = Math.min(100, currentProgress + 20);
        if (newProgress >= 100) {
            const duration = `${Math.floor(Math.random() * 12) + 8}s`;
            await db_1.db.query(`UPDATE tasks SET status = 'Success', progress = 100, duration = ?, confidence = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`, [duration, Math.floor(Math.random() * 5) + 95, taskId]);
            console.log(`[Worker] Task #${taskId} → Success (${duration})`);
            if (isStore && row.item_id) {
                const qty = quantity;
                await db_1.db.query(`UPDATE inventory_items 
           SET quantity = quantity + ?,
               status = CASE 
                 WHEN quantity + ? <= 0 THEN 'Out of Stock' 
                 WHEN quantity + ? <= 200 THEN 'Low Stock' 
                 ELSE 'In Stock' 
               END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`, [qty, qty, qty, row.item_id]);
                console.log(`[Worker] Inventory item ${row.item_id} incremented by ${qty}`);
            }
        }
        else {
            await db_1.db.query("UPDATE tasks SET progress = ? WHERE id = ?", [newProgress, taskId]);
            console.log(`[Worker] Task #${taskId} progress → ${newProgress}%`);
        }
    }
    catch (err) {
        console.error('[Worker] Error processing task queue:', err);
    }
}
// Run the worker every 3 seconds
setInterval(processTaskQueue, 3000);
const PORT = Number(process.env.PORT || 5000);
let server;
let workerInterval;
const startServer = async () => {
    server = app.listen(PORT, async () => {
        console.log(`[${new Date().toISOString()}] API server running on http://localhost:${PORT}`);
        // Test database connection
        const dbReady = await (0, db_1.testConnection)();
        if (dbReady) {
            console.log('[DB] MySQL database is ready.');
            console.log('[Worker] Task processor started (3s interval)');
        }
        else {
            console.error('[DB] Failed to connect to MySQL. Check your database configuration.');
        }
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`[Error] Port ${PORT} is already in use. Kill the process: netstat -ano | findstr :${PORT}`);
            process.exit(1);
        }
        throw err;
    });
    // Start background task worker
    workerInterval = setInterval(processTaskQueue, 3000);
};
// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('[Server] Shutting down gracefully...');
    if (workerInterval) {
        clearInterval(workerInterval);
        console.log('[Worker] Task processor stopped.');
    }
    if (server) {
        server.close(() => {
            console.log('[Server] HTTP server closed.');
        });
    }
    try {
        const connection = await db_1.db.getConnection();
        connection.release();
        console.log('[DB] Database connection released.');
    }
    catch (error) {
        console.error('[DB] Error closing connections:', error);
    }
    process.exit(0);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
startServer();
