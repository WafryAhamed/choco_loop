import { config } from "dotenv";
import mysql from "mysql2/promise";
import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";

config();

async function initDb() {
  // Connect WITHOUT specifying a database first (to create it)
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3308),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    multipleStatements: true,
  });

  console.log("Connected to MySQL server.");

  // Run schema (creates DB + tables)
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");
  await connection.query(schemaSql);
  console.log("Schema created successfully.");

  // Hash passwords for seed users
  const staffHash = await bcrypt.hash("staff123", 10);
  const supervisorHash = await bcrypt.hash("supervisor123", 10);
  const maintenanceHash = await bcrypt.hash("maintenance123", 10);

  // Switch to the database
  await connection.query("USE chocolate_warehouse_db");

  // Insert users with new roles
  await connection.query(
    `INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ["John Staff", "staff@choco.com", staffHash, "warehouse_staff"]
  );
  await connection.query(
    `INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ["Sarah Supervisor", "supervisor@choco.com", supervisorHash, "warehouse_supervisor"]
  );
  await connection.query(
    `INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ["Mike Maintenance", "maintenance@choco.com", maintenanceHash, "maintenance_staff"]
  );
  console.log("Users seeded (staff@choco.com / staff123, supervisor@choco.com / supervisor123, maintenance@choco.com / maintenance123).");

  // Seed inventory items ONLY if they don't exist yet (preserves existing quantities)
  await connection.query(
    `INSERT INTO inventory_items (name, sku, category, quantity, capacity, location, status) VALUES
     ('Milk Chocolate', 'CHOC-MILK-01', 'Milk Chocolate', 0, 1000, 'BIN-A', 'Out of Stock'),
     ('Dark Chocolate', 'CHOC-DARK-01', 'Dark Chocolate', 0, 1000, 'BIN-B', 'Out of Stock'),
     ('White Chocolate', 'CHOC-WHT-01', 'White Chocolate', 0, 1000, 'BIN-C', 'Out of Stock')
     ON DUPLICATE KEY UPDATE sku=sku`
  );
  console.log("Inventory items preserved (existing quantities kept).");

  // Seed robot
  await connection.query(
    `INSERT IGNORE INTO robots (name, status, battery_level, current_task_id) VALUES (?, ?, ?, ?)`,
    ["OpenCV Arm Alpha", "idle", 100, null]
  );
  console.log("Robot seeded.");

  // Seed default system settings
  const defaultSettings = [
    ['camera_ip', '192.168.1.100'],
    ['camera_index', '1'],
    ['camera_resolution', '640x480'],
    ['camera_auto_connect', 'true'],
    ['crop_top', '0'],
    ['crop_bottom', '480'],
    ['crop_left', '0'],
    ['crop_right', '640'],
    ['detection_colors', '{"red":true,"blue":true,"green":true,"yellow":false}'],
    ['connection_type', 'wifi'],
    ['robot_speed', '75'],
    ['simulation_mode', 'false'],
    ['serial_port', 'COM3'],
    ['wifi_ip', '10.20.255.136'],
    ['arm_acceleration', '50'],
    ['gripper_force', '60'],
    ['ai_model', 'nvidia/nemotron-3-super-120b-a12b:free'],
    ['temperature', '0.7'],
    ['max_tokens', '500'],
    ['context_memory', 'true'],
    ['tts_enabled', 'true'],
    ['tts_speed', '1.0'],
    ['sound_alerts', 'true'],
    ['email_alerts', 'false'],
    ['desktop_notifications', 'true'],
    ['email_address', ''],
    ['task_complete', 'true'],
    ['low_stock', 'true'],
    ['robot_error', 'true'],
    ['vision_detection', 'false'],
    ['alert_volume', '80']
  ];

  for (const [key, val] of defaultSettings) {
    await connection.query(
      `INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)`,
      [key, val]
    );
  }
  console.log("System settings seeded.");

  await connection.end();
  console.log("\n✅ Database initialized successfully!");
  console.log("   DB: chocolate_warehouse_db");
  console.log("   Login: admin@chocoloop.com / admin123");
  process.exit(0);
}

initDb().catch((error) => {
  console.error("❌ Failed to initialize database:", error.message || error);
  process.exit(1);
});
