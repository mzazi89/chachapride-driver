import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardDriver } from '../../../../lib/guard';

export async function PUT(request) {
  const { user, response } = await guardDriver();
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const phone = body.phone !== undefined ? String(body.phone).trim() || null : null;
  const licenseNumber = body.license_number !== undefined ? String(body.license_number).trim() : null;
  const vehicleModel = body.vehicle_model !== undefined ? String(body.vehicle_model).trim() : null;
  const plateNumber = body.plate_number !== undefined ? String(body.plate_number).trim() : null;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET phone = COALESCE($1, phone) WHERE id = $2', [
        phone,
        user.id,
      ]);
      const { rows } = await client.query(
        `UPDATE drivers SET
           license_number = COALESCE($1, license_number),
           vehicle_model = COALESCE($2, vehicle_model),
           plate_number = COALESCE($3, plate_number)
         WHERE user_id = $4
         RETURNING id, license_number, vehicle_model, plate_number, status, approved`,
        [licenseNumber, vehicleModel, plateNumber, user.id]
      );
      await client.query('COMMIT');
      return NextResponse.json({ driver: rows[0], phone });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[driver profile] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
