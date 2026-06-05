"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const db_1 = require("./db");
(0, dotenv_1.config)();
async function seedDb() {
    const seedPath = node_path_1.default.join(__dirname, 'seed.sql');
    const seedSql = await promises_1.default.readFile(seedPath, 'utf8');
    const statements = seedSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));
    for (const statement of statements) {
        await db_1.db.query(statement);
    }
    console.log('MySQL seed data applied successfully.');
    process.exit(0);
}
seedDb().catch((error) => {
    console.error('Failed to seed MySQL database:', error);
    process.exit(1);
});
