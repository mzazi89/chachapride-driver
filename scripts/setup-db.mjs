// Applies schema.sql to the database.
// Usage: node --env-file=.env.local scripts/setup-db.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schema = readFileSync(join(__dirname, '..', 'schema.sql'), 'utf8');

try {
  await pool.query(schema);
  console.log('Schema applied successfully.');
} catch (err) {
  console.error('Failed to apply schema:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
