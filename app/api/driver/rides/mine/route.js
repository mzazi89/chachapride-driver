import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';
import { guardDriver } from '../../../../../lib/guard';

const ACTIVE_STATUSES = ['accepted', 'en_route'];

export async function GET() {
  const { user, response } = await guardDriver();
  if (response) return response;

  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.user_id, r.pickup, r.destination, r.pickup_lat, r.pickup_lng,
              r.destination_lat, r.destination_lng, r.ride_type, r.price, r.status, r.created_at,
              u.name AS rider_name, u.phone AS rider_phone
       FROM rides r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.driver_id = $1 AND r.status = ANY($2)
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [user.id, ACTIVE_STATUSES]
    );

    return NextResponse.json({ ride: rows[0] || null });
  } catch (err) {
    console.error('[driver mine] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
