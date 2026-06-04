import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

config();

async function seedDb() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME || "chocolate_warehouse_db";

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  const seedPath = path.join(__dirname, "seed.sql");
  const seedSql = await fs.readFile(seedPath, "utf8");

  await connection.query(seedSql);
  await connection.end();

  console.log("MySQL seed data inserted successfully.");
}

seedDb().catch((error) => {
  console.error("Failed to seed MySQL database:", error);
  process.exit(1);
});
