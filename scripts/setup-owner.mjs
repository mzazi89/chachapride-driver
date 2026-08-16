// Creates or updates the owner account from environment variables.
// Usage: node --env-file=.env.local scripts/setup-owner.mjs
// Env: OWNER_EMAIL (default owner@chachapride.com), OWNER_PASSWORD (required, min 8),
//      OWNER_NAME (default 'Chacha Owner')
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const email = (process.env.OWNER_EMAIL || 'owner@chachapride.com').trim().toLowerCase();
const password = process.env.OWNER_PASSWORD;
const name = process.env.OWNER_NAME || 'Chacha Owner';

if (!password || password.length < 8) {
  console.error('OWNER_PASSWORD env var is required (min 8 characters).');
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'owner')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'owner', name = EXCLUDED.name
     RETURNING id, name, email, role`,
    [name, email, passwordHash]
  );
  console.log(`Owner account ready: ${rows[0].email} (role: ${rows[0].role})`);
} catch (err) {
  console.error('Failed to provision owner:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
