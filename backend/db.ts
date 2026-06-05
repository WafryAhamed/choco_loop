import { config } from "dotenv";
import mysql from "mysql2/promise";

config();

let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
const CONNECTION_RETRY_INTERVAL = 5000; // 5 seconds

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3308),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "chocolate_warehouse_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
<<<<<<< HEAD
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 30000
=======
>>>>>>> fix-camera
});

// Test connection and implement retry logic
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    connectionAttempts = 0;
    return true;
  } catch (error) {
    connectionAttempts++;
    console.error(`[DB] Connection test failed (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}):`, error);
    
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      console.log(`[DB] Retrying in ${CONNECTION_RETRY_INTERVAL / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, CONNECTION_RETRY_INTERVAL));
      return testConnection();
    }
    return false;
  }
}

// Handle pool errors
<<<<<<< HEAD
db.on('error', (err) => {
  console.error('[DB Pool Error]:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('[DB] Connection lost, will reconnect on next request');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('[DB] Fatal error, recreating pool');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_RETIRE') {
=======
;(db as any).on('error', (err: any) => {
  console.error('[DB Pool Error]:', err);
  if (err?.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('[DB] Connection lost, will reconnect on next request');
  }
  if (err?.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('[DB] Fatal error, recreating pool');
  }
  if (err?.code === 'PROTOCOL_ENQUEUE_AFTER_RETIRE') {
>>>>>>> fix-camera
    console.error('[DB] Connection retired');
  }
});
