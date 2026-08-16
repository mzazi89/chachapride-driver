import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardDriver } from '../../../../lib/guard';

export async function GET() {
  const { user, response } = await guardDriver();
  if (response) return response;

  try {
    const { rows } = await pool.query(
      `SELECT dr.id, dr.license_number, dr.vehicle_model, dr.plate_number, dr.status, dr.approved
       FROM drivers dr WHERE dr.user_id = $1`,
      [user.id]
    );
    const driver = rows[0];
    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }
    return NextResponse.json({
      driver,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('[driver me] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
