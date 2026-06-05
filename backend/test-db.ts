import { db } from "./db";

async function test() {
  try {
    const [rows] = await db.query(`
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
    console.log("SUCCESS:", rows);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();
