import { config } from "dotenv";
import mysql from "mysql2/promise";

config();

// In-Memory Database Fallback State
const fallbackDb = {
  users: [
    {
      id: 1,
      name: "Admin",
      email: "admin@warehouse.local",
      password_hash: "$2b$12$HaKg56d6ttmEctWwKIRM4eIvDaoWlNMMBbx2dJEfiJFQOYeyDkwxe",
      role: "admin",
    },
  ],
  inventory_items: [] as any[],
  tasks: [] as any[],
};

let useFallback = false;
let pool: mysql.Pool | null = null;

try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "chocolate_warehouse_db",
  });
} catch (e) {
  console.warn("[Database] MySQL initialization failed, enabling in-memory fallback.");
  useFallback = true;
}

export const db = {
  async query(sql: string, params: any[] = []): Promise<[any, any]> {
    if (!useFallback && pool) {
      try {
        return await pool.query(sql, params);
      } catch (err: any) {
        // If DB doesn't exist, table doesn't exist, or access denied, fall back to in-memory db
        if (
          err.code === "ER_ACCESS_DENIED_ERROR" ||
          err.code === "ER_BAD_DB_ERROR" ||
          err.code === "ER_NO_SUCH_TABLE" ||
          err.code === "ECONNREFUSED"
        ) {
          if (!useFallback) {
            console.warn(
              `[Database Warning] MySQL connection or query failed (${err.code}). Falling back to local stateful In-Memory database.`
            );
            useFallback = true;
          }
        } else {
          throw err;
        }
      }
    }

    // In-memory fallback simulation
    const sqlLower = sql.toLowerCase().replace(/\s+/g, " ");

    if (sqlLower.includes("select 1")) {
      return [[{ "1": 1 }], null];
    }

    if (sqlLower.includes("from users")) {
      if (sqlLower.includes("email = ?")) {
        const email = params[0]?.toLowerCase().trim();
        const user = fallbackDb.users.find((u) => u.email === email);
        return [user ? [user] : [], null];
      }
      if (sqlLower.includes("id = ?")) {
        const id = Number(params[0]);
        const user = fallbackDb.users.find((u) => u.id === id);
        return [user ? [user] : [], null];
      }
    }

    if (sqlLower.includes("from inventory_items")) {
      if (sqlLower.includes("group by category")) {
        // category as name, SUM(quantity) as value
        const groups: { [key: string]: number } = {};
        fallbackDb.inventory_items.forEach((item) => {
          groups[item.category] = (groups[item.category] || 0) + item.quantity;
        });
        const rows = Object.entries(groups).map(([name, value]) => ({ name, value }));
        return [rows, null];
      }
      
      // Get all inventory items
      const rows = fallbackDb.inventory_items.map((item) => ({
        id: String(item.id),
        sku: item.sku,
        name: item.name,
        category: item.category,
        stock: item.quantity,
        capacity: item.capacity,
        bin: item.location,
        status: item.status,
        lastUpdated: "Just now",
      }));
      return [rows, null];
    }

    if (sqlLower.includes("from tasks")) {
      if (sqlLower.includes("count(*) as totaltasks")) {
        // Stats for finished tasks
        const finished = fallbackDb.tasks.filter((t) => ["Success", "Failed"].includes(t.status));
        const success = finished.filter((t) => t.status === "Success").length;
        return [[{ totalTasks: finished.length, successTasks: success }], null];
      }

      if (sqlLower.includes("status not in ('success', 'failed')")) {
        // Active tasks
        const active = fallbackDb.tasks.filter((t) => !["Success", "Failed"].includes(t.status));
        const rows = active.map((t) => ({
          id: `T-${t.id}`,
          description: t.description,
          status: t.status,
          progress: t.progress,
          type: t.task_type,
        }));
        return [rows, null];
      }

      if (sqlLower.includes("status in ('success', 'failed')")) {
        // History tasks
        const history = fallbackDb.tasks.filter((t) => ["Success", "Failed"].includes(t.status));
        const rows = history.map((t) => ({
          id: `H-${t.id}`,
          timestamp: t.created_at,
          description: t.description,
          robotId: t.robot_id || "N/A",
          duration: t.duration || "0s",
          status: t.status,
          operator: t.operator || "AI",
          confidence: t.confidence || 100,
        }));
        return [rows, null];
      }
    }

    console.warn("[Database Fallback] Query did not match simulation: ", sql);
    return [[], null];
  },
};
