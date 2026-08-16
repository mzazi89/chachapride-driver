// Inserts demo accounts: owner, approved driver, rider (+ sample rides).
// Usage: node --env-file=.env.local scripts/seed.mjs
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const passwordHash = await bcrypt.hash('password123', 10);

async function upsertUser(email, name, role) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
     RETURNING id, role`,
    [name, email, passwordHash, role]
  );
  return rows[0];
}

try {
  const owner = await upsertUser('owner@chachapride.com', 'Chacha Owner', 'owner');
  const driver = await upsertUser('driver@chachapride.com', 'Demo Driver', 'driver');
  const rider = await upsertUser('demo@chachapride.com', 'Demo Rider', 'rider');

  await pool.query(
    `INSERT INTO drivers (user_id, license_number, vehicle_model, plate_number, status, approved)
     VALUES ($1, 'DL-2024-001', 'Toyota Corolla', 'SGC 1234 A', 'available', TRUE)
     ON CONFLICT (user_id) DO UPDATE SET approved = TRUE, status = 'available'`,
    [driver.id]
  );

  await pool.query(
    `INSERT INTO rides (user_id, pickup, destination, pickup_lat, pickup_lng, destination_lat, destination_lng, ride_type, price, status)
     VALUES
       ($1, 'Downtown Singapore', 'Changi Airport', 1.29027, 103.851959, 1.36442, 103.99153, 'uberx', 18.4, 'completed'),
       ($1, 'Orchard Road', 'Sentosa Island', 1.3039, 103.8316, 1.2494, 103.8303, 'comfort', 21.6, 'completed')
     ON CONFLICT DO NOTHING`,
    [rider.id]
  );

  console.log('Seed complete. Accounts (password123):');
  console.log('  owner  -> owner@chachapride.com  (owner site)');
  console.log('  driver -> driver@chachapride.com (driver site, approved)');
  console.log('  rider  -> demo@chachapride.com   (rider site)');
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
