import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '../../../../lib/db';
import { createSession } from '../../../../lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ['rider', 'driver'];

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const role = String(body.role ?? 'rider');
  const phone = String(body.phone ?? '').trim() || null;

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid account type' }, { status: 400 });
  }

  let driverInfo = null;
  if (role === 'driver') {
    const info = body.driverInfo || {};
    const licenseNumber = String(info.license_number ?? '').trim();
    const vehicleModel = String(info.vehicle_model ?? '').trim();
    const plateNumber = String(info.plate_number ?? '').trim();
    if (!licenseNumber || !vehicleModel || !plateNumber) {
      return NextResponse.json(
        { error: 'Driver details (license number, vehicle model, plate number) are required' },
        { status: 400 }
      );
    }
    driverInfo = { licenseNumber, vehicleModel, plateNumber };
  }

  try {
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (role === 'driver') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const u = await client.query(
          'INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, created_at',
          [name, email, passwordHash, 'driver', phone]
        );
        const d = await client.query(
          'INSERT INTO drivers (user_id, license_number, vehicle_model, plate_number) VALUES ($1, $2, $3, $4) RETURNING id, status, approved',
          [u.rows[0].id, driverInfo.licenseNumber, driverInfo.vehicleModel, driverInfo.plateNumber]
        );
        await client.query('COMMIT');
        await createSession(u.rows[0].id);
        return NextResponse.json(
          { user: u.rows[0], driver: d.rows[0] },
          { status: 201 }
        );
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash, 'rider', phone]
    );

    await createSession(rows[0].id);
    return NextResponse.json({ user: rows[0] }, { status: 201 });
  } catch (err) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    console.error('[signup] database error:', err.message);
    return NextResponse.json({ error: 'Database error. Check that DATABASE_URL is set and Neon is reachable.' }, { status: 500 });
  }
}
