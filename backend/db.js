"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.testConnection = testConnection;
const dotenv_1 = require("dotenv");
const promise_1 = __importDefault(require("mysql2/promise"));
(0, dotenv_1.config)();
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
const CONNECTION_RETRY_INTERVAL = 5000; // 5 seconds
exports.db = promise_1.default.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3308),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "chocolate_warehouse_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
// Test connection and implement retry logic
async function testConnection() {
    try {
        const connection = await exports.db.getConnection();
        await connection.ping();
        connection.release();
        connectionAttempts = 0;
        return true;
    }
    catch (error) {
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
;
exports.db.on('error', (err) => {
    console.error('[DB Pool Error]:', err);
    if (err?.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('[DB] Connection lost, will reconnect on next request');
    }
    if (err?.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.error('[DB] Fatal error, recreating pool');
    }
    if (err?.code === 'PROTOCOL_ENQUEUE_AFTER_RETIRE') {
        console.error('[DB] Connection retired');
    }
});
