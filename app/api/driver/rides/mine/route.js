import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';
import { guardDriver } from '../../../../../lib/guard';

const ACTIVE_STATUSES = ['accepted', 'en_route'];

export async function GET() {
  const { user, response } = await guardDriver();
  if (response) return response;

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, pickup, destination, pickup_lat, pickup_lng, destination_lat, destination_lng,
              ride_type, price, status, created_at
       FROM rides
       WHERE driver_id = $1 AND status = ANY($2)
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id, ACTIVE_STATUSES]
    );

    return NextResponse.json({ ride: rows[0] || null });
  } catch (err) {
    console.error('[driver mine] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
