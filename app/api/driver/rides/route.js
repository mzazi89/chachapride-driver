import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardDriver } from '../../../../lib/guard';

export async function GET(request) {
  const { user, response } = await guardDriver();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'requested';

    const { rows } = await pool.query(
      `SELECT id, pickup, destination, pickup_lat, pickup_lng, destination_lat, destination_lng,
              ride_type, price, created_at
       FROM rides
       WHERE status = $1 AND driver_id IS NULL
       ORDER BY created_at ASC
       LIMIT 20`,
      [status]
    );

    return NextResponse.json({ rides: rows });
  } catch (err) {
    console.error('[driver rides] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
