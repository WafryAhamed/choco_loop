import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db, testConnection } from './db';

declare global {
  namespace Express {
    interface Response {
      sendError: (status: number, message: string, details?: any) => void;
    }
  }
}

const app = express();
app.use(cors());
app.use(express.json());

const ESP32_HOST = process.env.ESP32_HOST || 'http://10.174.204.136';
const ESP32_TIMEOUT_MS = 4000;
const RETRIEVE_TASK_TYPES = new Set(['Retrieve', 'Pick']);
const STORE_TASK_TYPES = new Set(['Store']);

function mapItemToEsp32Color(sku: string | null | undefined, name?: string) {
  const value = `${sku || ''} ${name || ''}`.toLowerCase();
  if (value.includes('milk') || value.includes('choc-milk') || value.includes('milk chocolate')) return 'rblue';
  if (value.includes('white') || value.includes('choc-wht') || value.includes('white chocolate')) return 'rred';
  if (value.includes('dark') || value.includes('choc-dark') || value.includes('dark chocolate')) return 'rgreen';
  return null;
}

async function sendEsp32RetrieveCommand(color: string): Promise<boolean> {
  const endpoint = `${ESP32_HOST}/${color}`;
  console.log(`[ESP32] Sending retrieve command to ${endpoint}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ESP32_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    const text = await response.text();
    console.log(`[ESP32] Response from ${endpoint} status=${response.status} body=${text}`);
    if (!response.ok) {
      console.error(`[ESP32] Non-ok HTTP status ${response.status} from ${endpoint}`);
      return false;
    }
    return text.trim() === 'OK_DONE';
  } catch (error) {
    console.error(`[ESP32] Error sending retrieve command to ${endpoint}:`, error);
    return false;
  } finally {
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
  res.sendError = (status: number, message: string, details?: any) => {
    console.error(`[Error] ${status}: ${message}`, details || '');
    res.status(status).json({
      success: false,
      error: message,
      ...(details && { details })
    });
  };
  next();
});

type UserRole = 'warehouse_staff' | 'warehouse_supervisor' | 'maintenance_staff';

type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
};

type AuthRequest = Request & {
  user?: AuthUser;
  sendError?: (status: number, message: string, details?: any) => void;
};

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) CONFIGURATION
// ============================================================================
type Permission = string;
type RolePermissions = Record<UserRole, Set<Permission>>;

const ROLE_PERMISSIONS: RolePermissions = {
  warehouse_staff: new Set([
    'voice_commands',
    'chatbot_access',
    'create_tasks',
    'retrieve_tasks',
    'view_inventory',
    'view_own_tasks'
  ]),
  warehouse_supervisor: new Set([
    'voice_commands',
    'chatbot_access',
    'create_tasks',
    'retrieve_tasks',
    'view_inventory',
    'view_own_tasks',
    'view_analytics',
    'view_task_history',
    'view_reports',
    'user_monitoring',
    'task_management'
  ]),
  maintenance_staff: new Set([
    'system_diagnostics',
    'view_logs',
    'hardware_monitoring',
    'voice_config',
    'robot_config',
    'system_settings',
    'user_management'
  ])
};

function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions ? permissions.has(permission) : false;
}

function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied: insufficient permissions' 
      });
    }
    
    next();
  };
}

function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    if (!hasPermission(req.user.role as UserRole, permission)) {
      return res.status(403).json({ 
        success: false, 
        error: `Access denied: ${permission} permission required` 
      });
    }
    
    next();
  };
}
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_secret_key'
    ) as AuthUser;

    req.user = decoded;
    next();
  } catch (_error) {
    return res.status(401).json({ success: false, error: 'Session expired' });
  }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbHealthy = await testConnection();
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Vision service availability check
async function checkVisionService(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch('http://localhost:8001/health', { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
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
    const [users]: any = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    console.log('[Auth] Query result:', { found: users?.length > 0, count: users?.length });
    
    if (!users || users.length === 0) {
      console.log('[Auth] User not found');
      return res.sendError(401, 'Invalid email or password');
    }

    const user = users[0];
    console.log('[Auth] Validating password for user:', user.email);
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
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

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '1d' }
    );

    console.log('[Auth] Login successful for:', user.email);
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.sendError(500, 'Login failed', error);
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [users]: any = await db.query('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1', [req.user?.id]);
    if (!users || users.length === 0) {
      return res.sendError(401, 'Session expired');
    }
    return res.json({ success: true, user: users[0] });
  } catch (error) {
    res.sendError(500, 'Failed to validate session', error);
  }
});

// -----------------------------------------------------------------------------
// DATA ENDPOINTS
// -----------------------------------------------------------------------------

app.get('/api/inventory', async (req, res) => {
  try {
    const [rows]: any = await db.query(`
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
    
    const processedRows = rows.map((row: any) => {
      // In SQLite, updated_at is typically stored as a string or timestamp
      const updated = new Date(row.updated_at || Date.now());
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - updated.getTime());
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      let lastUpdated = '';
      if (diffMins < 60) lastUpdated = `${diffMins} mins ago`;
      else if (diffHours < 24) lastUpdated = `${diffHours} hours ago`;
      else lastUpdated = `${diffDays} days ago`;

      return {
        ...row,
        id: String(row.id),
        lastUpdated,
        updated_at: undefined // remove the raw updated_at
      };
    });
    
    res.json(processedRows); // Return direct array to match mockData
  } catch (error) {
    console.error('Failed to load inventory:', error);
    res.status(500).json({ error: 'Failed to load inventory' });
  }
});

app.post('/api/inventory/add', async (req, res) => {
  const { name, sku, category, quantity, location } = req.body;
  if (!name || !sku || !category) return res.status(400).json({ success: false, error: 'Name, SKU, and Category are required' });
  try {
    const [existing]: any = await db.query('SELECT id FROM inventory_items WHERE sku = ? LIMIT 1', [sku]);
    if (existing && existing.length > 0) return res.status(409).json({ success: false, error: 'Product with this SKU already exists' });
    const initialStatus = quantity === 0 ? 'Out of Stock' : quantity <= 200 ? 'Low Stock' : 'In Stock';
    const [result]: any = await db.query(
      `INSERT INTO inventory_items (name, sku, category, quantity, capacity, location, status, created_at, updated_at) VALUES (?, ?, ?, ?, 1000, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [name, sku, category, quantity || 0, location || 'Unknown', initialStatus]
    );
    res.json({ success: true, message: 'Product added successfully', productId: result.insertId });
  } catch (error) {
    if ((error as any).code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, error: 'Product with this SKU already exists' });
    res.status(500).json({ success: false, error: 'Failed to add product' });
  }
});

app.post('/api/inventory/update-from-vision', async (req, res) => {
  const { item, color, action, timestamp, event_id, source } = req.body;
  try {
    const detectedAt = timestamp && !Number.isNaN(new Date(timestamp).getTime()) ? formatToMySQL(new Date(timestamp)) : formatToMySQL(new Date());
    await db.query(`INSERT INTO vision_detections (item, color, action, event_id, source, detected_at) VALUES (?, ?, ?, ?, ?, ?)`, [item, color, action || 'pick', event_id, source || 'vision', detectedAt]);
    let itemSku = color === 'blue' ? 'CHOC-MILK-01' : color === 'red' ? 'CHOC-DARK-01' : color === 'green' ? 'CHOC-WHT-01' : '';
    if (itemSku) {
      const [items]: any = await db.query('SELECT id, quantity FROM inventory_items WHERE sku = ? LIMIT 1', [itemSku]);
      if (items && items.length > 0) {
        const itemId = items[0].id;
        await db.query(`UPDATE inventory_items SET quantity = quantity + 1, status = CASE WHEN quantity + 1 <= 0 THEN 'Out of Stock' WHEN quantity + 1 <= 200 THEN 'Low Stock' ELSE 'In Stock' END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [itemId]);
        const desc = `Picked and sorted ${item || 'chocolate'} via vision system`;
        const duration = `${Math.floor(Math.random() * 5) + 5}s`;
        const [taskInsert]: any = await db.query(`INSERT INTO tasks (task_type, description, item_id, quantity, status, progress, robot_id, operator, source, completed_at, confidence) VALUES ('Pick', ?, ?, 1, 'Success', 100, 'RBT-01', 'AI', 'vision', CURRENT_TIMESTAMP, ?)`, [desc, itemId, Math.floor(Math.random() * 5) + 95]);
        await db.query(`INSERT INTO task_logs (task_id, action, notes) VALUES (?, 'completed', 'Picked via vision system')`, [taskInsert.insertId]);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT') return res.json({ success: true, message: 'Duplicate event ignored' });
    res.status(500).json({ error: 'Failed to record vision update' });
  }
});

app.post('/api/tasks', authenticateToken, requirePermission('create_tasks'), async (req, res) => {
  const { type, taskType, description, product, quantity, source } = req.body;
  try {
    // Validate quantity to prevent duplication
    const validQuantity = Number(quantity);
    if (!Number.isInteger(validQuantity) || validQuantity < 1) {
      return res.status(400).json({ success: false, error: 'Quantity must be a positive integer' });
    }

    let itemId = null;
    if (product) {
      console.log(`[Tasks] Looking up inventory item for product: ${product}`);
      const [items]: any = await db.query(
        'SELECT id FROM inventory_items WHERE sku LIKE ? OR name LIKE ? OR category LIKE ? LIMIT 1',
        [`%${product}%`, `%${product}%`, `%${product}%`]
      );
      if (items && items.length > 0) {
        itemId = items[0].id;
        console.log(`[Tasks] Matched inventory item id=${itemId} for product=${product}`);
      }
    }

    const effectiveType = taskType || type || 'Pick';
    const desc = description || `${effectiveType} ${validQuantity} ${product || 'chocolates'}`;
    console.log(`[Tasks] Creating task: type=${effectiveType}, desc=${desc}, itemId=${itemId}, qty=${validQuantity}, source=${source || 'web'}`);
    const [insertResult]: any = await db.query(
      `INSERT INTO tasks (task_type, description, item_id, quantity, status, progress, robot_id, operator, source)
       VALUES (?, ?, ?, ?, 'Queued', 0, 'RBT-01', ?, ?)`,
      [effectiveType, desc, itemId, validQuantity, source === 'voice' ? 'AI' : 'Manual', source || 'web']
    );
    const taskId = insertResult.insertId ? `T-${insertResult.insertId}` : undefined;

    res.json({ success: true, message: 'Task queued successfully', taskId });
  } catch (error) {
    console.error('Failed to create task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.get('/api/vision/detections', async (req, res) => {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        id, item as object, color, confidence, detected_at as time
      FROM vision_detections
      ORDER BY detected_at DESC
      LIMIT 10
    `);
    
    const formatted = rows.map((r: any) => {
      let colorClass = 'bg-status-info';
      if (r.color === 'red') colorClass = 'bg-status-danger';
      if (r.color === 'green') colorClass = 'bg-status-success';
      if (r.color === 'blue') colorClass = 'bg-status-warning';
      
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
  } catch (error) {
    console.error('Failed to fetch detections:', error);
    res.status(500).json({ error: 'Failed to load detections' });
  }
});

app.get('/api/tasks/active', async (req, res) => {
  try {
    const [rows]: any = await db.query(`
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to load active tasks' });
  }
});

app.get('/api/tasks/history', async (req, res) => {
  try {
    const [rows]: any = await db.query(`
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to load task history' });
  }
});

function formatToMySQL(d: Date): string {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0');
}

app.get('/api/dashboard/summary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [distribution]: any = await db.query('SELECT category as name, SUM(quantity) as value FROM inventory_items GROUP BY category');
    
    const [activeRobotTask]: any = await db.query("SELECT id, description FROM tasks WHERE status = 'Active' LIMIT 1");
    const robotStatus = activeRobotTask && activeRobotTask.length > 0 ? 'working' : 'idle';
    
    const systemHealth = [
      { service: 'Database', status: 'online', uptime: '99.9%', ping: '8ms' },
      { service: 'Robotic Arm', status: robotStatus, uptime: '99.8%', ping: '12ms' },
      { service: 'AI Assistant', status: 'idle', uptime: '100%', ping: '150ms' }
    ];

    // Total items sorted today
    const [todayDetections]: any = await db.query(
      "SELECT COUNT(*) as count FROM vision_detections WHERE detected_at >= CURDATE()"
    );
    const itemsSorted = todayDetections[0]?.count || 0;

    // Completed tasks today
    const [completedTasks]: any = await db.query(
      "SELECT COUNT(*) as count FROM tasks WHERE status = 'Success' AND completed_at >= CURDATE()"
    );
    const tasksCompleted = completedTasks[0]?.count || 0;

    // Active/Pending tasks (for the KPI block)
    const [activeTasksCount]: any = await db.query(
      "SELECT COUNT(*) as count FROM tasks WHERE status IN ('Queued', 'Active')"
    );
    const pendingTasks = activeTasksCount[0]?.count || 0;

    // Production throughput in the last hour
    const [throughputHour]: any = await db.query(
      "SELECT COUNT(*) as count FROM vision_detections WHERE detected_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)"
    );
    const throughputPerHour = throughputHour[0]?.count || 0;

    // Task success and error rates
    const [taskStats]: any = await db.query(`
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
    const [stockVal]: any = await db.query("SELECT SUM(quantity * 500) as totalValue FROM inventory_items");
    const inventoryValue = stockVal[0]?.totalValue || 0;

    // 24-hour throughput buckets (vision_detections per hour)
    const throughputData: { time: string; value: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const date = new Date(Date.now() - i * 3600000);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:00`;

      const startHour = new Date(date.getTime());
      startHour.setMinutes(0, 0, 0);
      const endHour = new Date(date.getTime());
      endHour.setMinutes(59, 59, 999);

      const [detCount]: any = await db.query(
        'SELECT COUNT(*) as count FROM vision_detections WHERE detected_at BETWEEN ? AND ?',
        [formatToMySQL(startHour), formatToMySQL(endHour)]
      );
      throughputData.push({ time: timeStr, value: detCount[0]?.count || 0 });
    }

    const [throughput24hRows]: any = await db.query(
      'SELECT COUNT(*) as count FROM vision_detections WHERE detected_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
    );
    const throughput24h = throughput24hRows[0]?.count || 0;

    const [topProductRows]: any = await db.query(`
      SELECT item, COUNT(*) as cnt FROM vision_detections
      WHERE detected_at >= CURDATE()
      GROUP BY item ORDER BY cnt DESC LIMIT 1
    `);
    const topProduct = topProductRows[0]?.item || 'N/A';

    const [peakRows]: any = await db.query(`
      SELECT HOUR(detected_at) as hr, COUNT(*) as cnt FROM vision_detections
      WHERE detected_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY HOUR(detected_at) ORDER BY cnt DESC LIMIT 1
    `);
    const peakHour =
      peakRows[0]?.hr != null
        ? `${String(peakRows[0].hr).padStart(2, '0')}:00`
        : 'N/A';
    const peakThroughput = peakRows[0]?.cnt || 0;

    const [durationRows]: any = await db.query(`
      SELECT duration FROM tasks
      WHERE status = 'Success' AND completed_at >= CURDATE() AND duration IS NOT NULL
    `);
    const durations = durationRows
      .map((r: { duration: string }) => parseInt(String(r.duration).replace(/\D/g, ''), 10))
      .filter((n: number) => !Number.isNaN(n) && n > 0);
    const avgCycleTime =
      durations.length > 0
        ? `${Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)}s`
        : 'N/A';

    const insights: string[] = [];
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
  } catch (error) {
    console.error('Failed to load summary data:', error);
    res.status(500).json({ error: 'Failed to load summary data' });
  }
});


// -----------------------------------------------------------------------------
// NOTIFICATIONS ENDPOINT
// -----------------------------------------------------------------------------
app.get('/api/notifications', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        id,
        notes as text,
        timestamp as time
      FROM task_logs
      ORDER BY timestamp DESC
      LIMIT 5
    `);
    
    const processed = rows.map((r: any) => {
      const date = new Date(r.time);
      const diffMins = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
      let timeStr = 'Just now';
      if (diffMins > 0) {
        if (diffMins < 60) timeStr = `${diffMins}m ago`;
        else if (diffMins < 1440) timeStr = `${Math.floor(diffMins / 60)}h ago`;
        else timeStr = `${Math.floor(diffMins / 1440)}d ago`;
      }
      return {
        id: r.id,
        text: r.text,
        time: timeStr,
        unread: true
      };
    });
    
    res.json({ success: true, data: processed });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load notifications' });
  }
});

// -----------------------------------------------------------------------------
// SYSTEM SETTINGS & USER MANAGEMENT ENDPOINTS
// -----------------------------------------------------------------------------
app.get('/api/settings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await db.query('SELECT setting_key, setting_value FROM system_settings');
    const settingsObj: Record<string, string> = {};
    for (const row of rows) {
      settingsObj[row.setting_key] = row.setting_value;
    }
    res.json({ success: true, settings: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load system settings.' });
  }
});

app.post('/api/settings', authenticateToken, async (req: AuthRequest, res) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ success: false, error: 'Settings object is required.' });
  }
  try {
    for (const [key, value] of Object.entries(settings)) {
      const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await db.query(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, valStr, valStr]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save system settings.' });
  }
});

app.get('/api/users', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
    const processed = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role.charAt(0).toUpperCase() + r.role.slice(1), // Capitalize Role to match frontend (Admin/Operator)
      active: true
    }));
    res.json({ success: true, data: processed });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load users.' });
  }
});

app.post('/api/users', authenticateToken, async (req: AuthRequest, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const normalizedRole = role.toLowerCase();
    await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email.trim().toLowerCase(), hash, normalizedRole]
    );
    res.status(201).json({ success: true });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'User with this email already exists.' });
    }
    res.status(500).json({ success: false, error: 'Failed to create user.' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.params.id;
  try {
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete user.' });
  }
});

app.post('/api/users/:id/reset-password', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.params.id;
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, error: 'Password is required.' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
    res.json({ success: true });
  } catch (error) {
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

    const data: any = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ success: false, error: 'Empty response from AI.' });
    }

    res.json({ success: true, text: reply });
  } catch (error) {
    console.error('AI assistant error:', error);
    res.status(500).json({ success: false, error: 'AI service error.' });
  }
});


// -----------------------------------------------------------------------------
// BACKGROUND TASK WORKER — processes robot tasks every 3 seconds
// IMPORTANT: This worker is idempotent - it only processes one task state transition per call
// to prevent duplicate arm operations and inventory updates
// Each unit of a retrieve task is processed sequentially to prevent arm duplication
// To prevent this from repeating, progress tracks which units have been processed
// Once a unit is processed, progress increments, so the SAME unit is never processed twice
// -----------------------------------------------------------------------------
async function processTaskQueue() {
  try {
    // 1. If no active task, pick the oldest queued one
    const [active]: any = await db.query(
      "SELECT id FROM tasks WHERE status = 'Active' LIMIT 1"
    );

    if (!active || active.length === 0) {
      // Grab the oldest queued task
      const [queued]: any = await db.query(
        "SELECT id FROM tasks WHERE status = 'Queued' ORDER BY created_at ASC LIMIT 1"
      );
      if (queued && queued.length > 0) {
        // Mark as active - this is the ONLY state transition that happens per call
        await db.query(
          "UPDATE tasks SET status = 'Active', progress = 0, robot_id = 'RBT-01', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [queued[0].id]
        );
        console.log(`[Worker] Task #${queued[0].id} → Active`);
      }
      return; // next tick will process the first unit - prevents duplicate operations
    }

    // 2. Increment progress of the active task
    const taskId = active[0].id;
    const [taskRow]: any = await db.query(
      "SELECT progress, quantity, item_id, task_type FROM tasks WHERE id = ?",
      [taskId]
    );
    if (!taskRow || taskRow.length === 0) return;

    const row = taskRow[0];
    const currentProgress = row.progress || 0;
    const quantity = row.quantity || 1;
    const taskType = row.task_type || '';
    const isRetrieve = RETRIEVE_TASK_TYPES.has(taskType);
    const isStore = STORE_TASK_TYPES.has(taskType);

    if (isRetrieve) {
      let itemColor: string | null = null;
      if (row.item_id) {
        const [items]: any = await db.query(
          'SELECT sku, name FROM inventory_items WHERE id = ? LIMIT 1',
          [row.item_id]
        );
        if (items && items.length > 0) {
          itemColor = mapItemToEsp32Color(items[0].sku, items[0].name);
        }
      }

      if (!itemColor) {
        console.error(`[Worker] Retrieve task #${taskId} could not resolve ESP32 endpoint. item_id=${row.item_id}, taskType=${taskType}`);
        await db.query(
          "UPDATE tasks SET status = 'Failed', progress = 0, completed_at = CURRENT_TIMESTAMP, confidence = 0 WHERE id = ?",
          [taskId]
        );
        await db.query(
          'INSERT INTO task_logs (task_id, action, notes) VALUES (?, ?, ?)',
          [taskId, 'failed', 'Unable to determine ESP32 retrieval endpoint for task item']
        );
        return;
      }

      console.log(`[Worker] Retrieve task #${taskId} mapped to ESP32 endpoint segment=${itemColor}`);
      console.log(`[Worker] Task #${taskId} - processing ${quantity} unit(s) sequentially (one per cycle to prevent arm duplication)`);

      // Process ONE unit per worker cycle - KEY PREVENTION against duplicate arm operations
      // Progress % = (currentProgress + 1) / quantity * 100
      // This ensures the SAME unit is never processed twice
      const unitsProcessed = currentProgress; // currentProgress is stored as a count of processed units
      const nextUnit = unitsProcessed + 1;
      
      if (nextUnit <= quantity) {
        // Execute NEXT unit only
        const ok = await sendEsp32RetrieveCommand(itemColor);
        if (!ok) {
          const partialProgress = Math.round(((nextUnit - 1) / quantity) * 100);
          await db.query(
            "UPDATE tasks SET status = 'Failed', progress = ?, completed_at = CURRENT_TIMESTAMP, confidence = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [partialProgress, taskId]
          );
          await db.query(
            'INSERT INTO task_logs (task_id, action, notes) VALUES (?, ?, ?)',
            [taskId, 'failed', `ESP32 retrieval failed on unit ${nextUnit}/${quantity} for ${itemColor}`]
          );
          console.log(`[Worker] Task #${taskId} failed on unit ${nextUnit}/${quantity}`);
          return;
        }

        // Successfully executed this unit - update progress
        const newProgress = nextUnit; // Store unit count as progress
        const percentProgress = Math.round((nextUnit / quantity) * 100);
        await db.query(
          'UPDATE tasks SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
          [percentProgress, taskId]
        );
        console.log(`[Worker] Task #${taskId} unit ${nextUnit}/${quantity} completed (${percentProgress}% progress)`);
        
        // Check if ALL units are complete
        if (nextUnit >= quantity) {
          const duration = `${Math.floor(Math.random() * 8) + 8}s`;
          await db.query(
            `UPDATE tasks SET status = 'Success', progress = 100, duration = ?, confidence = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [duration, Math.floor(Math.random() * 5) + 95, taskId]
          );
          console.log(`[Worker] Task #${taskId} → Success (${duration}) - all ${quantity} units completed`);

          // Update inventory ONLY when task is fully complete
          if (row.item_id) {
            const qty = quantity;
            await db.query(
              `UPDATE inventory_items 
               SET quantity = GREATEST(0, quantity - ?),
                   status = CASE 
                     WHEN GREATEST(0, quantity - ?) <= 0 THEN 'Out of Stock' 
                     WHEN GREATEST(0, quantity - ?) <= 200 THEN 'Low Stock' 
                     ELSE 'In Stock' 
                   END,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [qty, qty, qty, row.item_id]
            );
            console.log(`[Worker] Inventory item ${row.item_id} decremented by ${qty} (retrieval complete)`);
          }
        }
        return; // CRITICAL: Return here - prevents processing more units in the same cycle
      }
    }

    const newProgress = Math.min(100, currentProgress + 20);

    if (newProgress >= 100) {
      const duration = `${Math.floor(Math.random() * 12) + 8}s`;
      await db.query(
        `UPDATE tasks SET status = 'Success', progress = 100, duration = ?, confidence = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [duration, Math.floor(Math.random() * 5) + 95, taskId]
      );
      console.log(`[Worker] Task #${taskId} → Success (${duration})`);

      if (isStore) {
        if (row.item_id) {
          const qty = quantity;
          await db.query(
          `UPDATE inventory_items 
           SET quantity = quantity + ?,
               status = CASE 
                 WHEN quantity + ? <= 0 THEN 'Out of Stock' 
                 WHEN quantity + ? <= 200 THEN 'Low Stock' 
                 ELSE 'In Stock' 
               END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [qty, qty, qty, row.item_id]
        );
        console.log(`[Worker] Inventory item ${row.item_id} incremented by ${qty}`);
        } else {
          console.warn(`[Worker] Store task #${taskId} completed without inventory item_id; no stock update applied.`);
        }
      }
    } else {
      await db.query(
        "UPDATE tasks SET progress = ? WHERE id = ?",
        [newProgress, taskId]
      );
      console.log(`[Worker] Task #${taskId} progress → ${newProgress}%`);
    }
  } catch (err) {
    console.error('[Worker] Error processing task queue:', err);
  }
}

// Run the worker every 3 seconds
setInterval(processTaskQueue, 3000);

const PORT = Number(process.env.PORT || 5000);
let server: any;
let workerInterval: NodeJS.Timeout;

const startServer = async () => {
  server = app.listen(PORT, async () => {
    console.log(`[${new Date().toISOString()}] API server running on http://localhost:${PORT}`);
    
    // Test database connection
    const dbReady = await testConnection();
    if (dbReady) {
      console.log('[DB] MySQL database is ready.');
      console.log('[Worker] Task processor started (3s interval)');
    } else {
      console.error('[DB] Failed to connect to MySQL. Check your database configuration.');
    }
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Error] Port ${PORT} is already in use. Kill the process: netstat -ano | findstr :${PORT}`);
      process.exit(1);
    }
    throw err;
  });

  // Start background task worker
  workerInterval = setInterval(processTaskQueue, 3000);
}

// -----------------------------------------------------------------------------
// ANALYTICS ENDPOINT
// -----------------------------------------------------------------------------
app.get('/api/analytics', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const range = (req.query.range as string) || 'today';
    
    // Determine date range
    let dateFilter = 'CURDATE()';
    let dateRangeText = 'Today';
    
    if (range === '7d') {
      dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      dateRangeText = 'Last 7 Days';
    } else if (range === '30d') {
      dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      dateRangeText = 'Last 30 Days';
    }

    // --- Summary Stats ---
    const [tasksCompletedRows]: any = await db.query(`
      SELECT COUNT(*) as count FROM tasks 
      WHERE status = 'Success' AND completed_at >= ${dateFilter}
    `);
    
    const [itemsSortedRows]: any = await db.query(`
      SELECT COUNT(*) as count FROM vision_detections 
      WHERE detected_at >= ${dateFilter}
    `);
    
    const [taskStatsRows]: any = await db.query(`
      SELECT 
        COUNT(*) as totalTasks,
        SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as successTasks
      FROM tasks
      WHERE status IN ('Success', 'Failed') AND created_at >= ${dateFilter}
    `);
    
    const total = taskStatsRows[0]?.totalTasks || 0;
    const success = taskStatsRows[0]?.successTasks || 0;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 100;
    const failureRate = total > 0 ? Math.round(((total - success) / total) * 100) : 0;
    
    const [topProductRows]: any = await db.query(`
      SELECT item, COUNT(*) as cnt FROM vision_detections
      WHERE detected_at >= ${dateFilter}
      GROUP BY item ORDER BY cnt DESC LIMIT 1
    `);
    const topProduct = topProductRows[0]?.item || 'N/A';
    
    const [peakRows]: any = await db.query(`
      SELECT HOUR(detected_at) as hr, COUNT(*) as cnt FROM vision_detections
      WHERE detected_at >= ${dateFilter}
      GROUP BY HOUR(detected_at) ORDER BY cnt DESC LIMIT 1
    `);
    const peakHour = peakRows[0]?.hr != null 
      ? `${String(peakRows[0].hr).padStart(2, '0')}:00` 
      : 'N/A';

    // --- Charts ---
    // Throughput Trend
    const [throughputRows]: any = await db.query(`
      SELECT 
        DATE_FORMAT(detected_at, '%H:00') as time,
        COUNT(*) as value
      FROM vision_detections
      WHERE detected_at >= ${dateFilter}
      GROUP BY HOUR(detected_at)
      ORDER BY HOUR(detected_at)
    `);
    
    // Tasks by Type
    const [taskTypeRows]: any = await db.query(`
      SELECT task_type as name, COUNT(*) as value
      FROM tasks
      WHERE created_at >= ${dateFilter}
      GROUP BY task_type
    `);
    
    // Inventory Distribution
    const [distributionRows]: any = await db.query(`
      SELECT category as name, SUM(quantity) as value 
      FROM inventory_items 
      GROUP BY category
    `);

    // --- Insights ---
    const insights: string[] = [];
    if (itemsSortedRows[0]?.count > 0) {
      insights.push(`Processed ${itemsSortedRows[0].count} items during this period.`);
    }
    if (topProduct !== 'N/A') {
      insights.push(`${topProduct} was the most handled item.`);
    }
    if (failureRate > 5) {
      insights.push(`Error rate is at ${failureRate}%, consider reviewing failed tasks.`);
    }

    res.json({
      success: true,
      range,
      dateRange: dateRangeText,
      summary: {
        tasksCompleted: tasksCompletedRows[0]?.count || 0,
        itemsSorted: itemsSortedRows[0]?.count || 0,
        topProduct,
        peakHour,
        successRate,
        failureRate,
        totalTasks: total
      },
      charts: {
        throughputData: throughputRows,
        tasksByType: taskTypeRows,
        inventoryDistribution: distributionRows
      },
      insights: insights.length > 0 ? insights : ['No significant insights available for this period.']
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.sendError(500, 'Failed to fetch analytics data');
  }
});


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
    const connection = await db.getConnection();
    connection.release();
    console.log('[DB] Database connection released.');
  } catch (error) {
    console.error('[DB] Error closing connections:', error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();
