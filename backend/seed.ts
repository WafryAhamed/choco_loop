import { config } from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from './db';

config();

async function seedDb() {
  const seedPath = path.join(__dirname, 'seed.sql');
  const seedSql = await fs.readFile(seedPath, 'utf8');
  const statements = seedSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    await db.query(statement);
  }

  console.log('MySQL seed data applied successfully.');
  process.exit(0);
}

seedDb().catch((error) => {
  console.error('Failed to seed MySQL database:', error);
  process.exit(1);
});
