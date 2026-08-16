import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardRole } from '../../../../lib/guard';

// Lets the owner operate as a driver: upserts an approved driver profile
// for the owner account using env-provided vehicle details.
export async function POST() {
  const { user, response } = await guardRole('owner');
  if (response) return response;

  const license = process.env.OWNER_LICENSE || 'OWNER-DRIVER';
  const vehicle = process.env.OWNER_VEHICLE || 'Owner Vehicle';
  const plate = process.env.OWNER_PLATE || 'OWNER-01';

  try {
    const { rows } = await pool.query(
      `INSERT INTO drivers (user_id, license_number, vehicle_model, plate_number, status, approved)
       VALUES ($1, $2, $3, $4, 'offline', TRUE)
       ON CONFLICT (user_id) DO UPDATE SET approved = TRUE, license_number = EXCLUDED.license_number,
         vehicle_model = EXCLUDED.vehicle_model, plate_number = EXCLUDED.plate_number
       RETURNING id, license_number, vehicle_model, plate_number, status, approved`,
      [user.id, license, vehicle, plate]
    );
    return NextResponse.json({ driver: rows[0] });
  } catch (err) {
    console.error('[ensure-driver] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
