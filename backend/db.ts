import { config } from "dotenv";
import mysql from "mysql2/promise";

config();

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3308),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "chocolate_warehouse_db",
});
