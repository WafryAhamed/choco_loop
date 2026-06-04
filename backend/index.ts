import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db';

const app = express();
app.use(cors());
app.use(express.json());

type AuthUser = {
  id: number;
  email: string;
  role: 'admin' | 'operator' | string;
};

type AuthRequest = Request & {
  user?: AuthUser;
};

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

// -----------------------------------------------------------------------------
// AUTH ENDPOINTS
// -----------------------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    const [users]: any = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [users]: any = await db.query('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1', [req.user?.id]);
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, error: 'Session expired' });
    }
    return res.json({ success: true, user: users[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to validate session.' });
  }
});

// -----------------------------------------------------------------------------
// DATA ENDPOINTS
// -----------------------------------------------------------------------------

app.get('/api/inventory', async (req, res) => {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        CAST(id AS CHAR) as id,
        sku, 
        name, 
        category, 
        quantity AS stock, 
        capacity, 
        location AS bin, 
        status, 
        CASE 
          WHEN TIMESTAMPDIFF(MINUTE, updated_at, NOW()) < 60 THEN CONCAT(TIMESTAMPDIFF(MINUTE, updated_at, NOW()), ' mins ago')
          WHEN TIMESTAMPDIFF(HOUR, updated_at, NOW()) < 24 THEN CONCAT(TIMESTAMPDIFF(HOUR, updated_at, NOW()), ' hours ago')
          ELSE CONCAT(TIMESTAMPDIFF(DAY, updated_at, NOW()), ' days ago')
        END as lastUpdated
      FROM inventory_items
      ORDER BY id ASC
    `);
    res.json(rows); // Return direct array to match mockData
  } catch (error) {
    console.error('Failed to load inventory:', error);
    res.status(500).json({ error: 'Failed to load inventory' });
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

app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const throughputData: any[] = [];

    const [distribution]: any = await db.query('SELECT category as name, SUM(quantity) as value FROM inventory_items GROUP BY category');
    
    const systemHealth = [
      { service: 'Database', status: 'online', uptime: '99.9%', ping: '8ms' },
      { service: 'AI Assistant', status: 'idle', uptime: '100%', ping: '150ms' }
    ];

    const [taskStats]: any = await db.query(`
      SELECT 
        COUNT(*) as totalTasks,
        SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as successTasks
      FROM tasks
      WHERE status IN ('Success', 'Failed')
    `);
    const total = taskStats[0]?.totalTasks || 0;
    const success = taskStats[0]?.successTasks || 0;

    const dailySummary = {
      tasksCompleted: total,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
      errorRate: total > 0 ? Math.round(((total - success) / total) * 100) : 0,
      avgCycleTime: '0s',
      itemsSorted: 0,
      topProduct: 'N/A',
      peakHour: 'N/A',
      peakThroughput: 0,
      insights: []
    };

    res.json({
      throughputData,
      inventoryDistribution: distribution || [],
      systemHealth,
      dailySummary
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load summary data' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`API server running on http://localhost:${PORT}`);
  if (process.env.ENABLE_DB_CHECK === 'true') {
    try {
      await db.query('SELECT 1');
      console.log('MySQL connection pool is ready.');
    } catch (error) {
      console.error('MySQL connection failed:', error);
    }
  }
});
