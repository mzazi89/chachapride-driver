import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardDriver } from '../../../../lib/guard';

export async function GET() {
  const { user, response } = await guardDriver();
  if (response) return response;

  try {
    const { rows } = await pool.query(
      `SELECT id, pickup, destination, ride_type, price, status, created_at
       FROM rides
       WHERE driver_id = $1 AND status = 'completed'
       ORDER BY created_at DESC`,
      [user.id]
    );

    const { rows: totals } = await pool.query(
      `SELECT count(*)::int AS trips, COALESCE(sum(price), 0)::float AS total_earnings
       FROM rides WHERE driver_id = $1 AND status = 'completed'`,
      [user.id]
    );
    const { rows: today } = await pool.query(
      `SELECT COALESCE(sum(price), 0)::float AS today_earnings
       FROM rides WHERE driver_id = $1 AND status = 'completed' AND created_at::date = CURRENT_DATE`,
      [user.id]
    );

    return NextResponse.json({
      rides: rows,
      summary: { ...totals[0], today_earnings: today[0].today_earnings },
    });
  } catch (err) {
    console.error('[driver history] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
