import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

config();

async function initDb() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD ?? "";

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  await connection.query(schemaSql);
  await connection.end();

  console.log("MySQL schema initialized successfully.");
}

initDb().catch((error) => {
  console.error("Failed to initialize MySQL schema:", error);
  process.exit(1);
});
