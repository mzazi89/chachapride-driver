import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardDriver } from '../../../../lib/guard';

export async function GET() {
  const { user, response } = await guardDriver();
  if (response) return response;

  try {
    const { rows } = await pool.query(
      `SELECT cs.id, cs.amount, cs.status, cs.deposited_at, cs.verified_at, cs.created_at,
              r.pickup, r.destination, r.ride_type, r.price
       FROM cash_settlements cs
       JOIN rides r ON r.id = cs.ride_id
       WHERE cs.driver_id = $1
       ORDER BY cs.created_at DESC`,
      [user.id]
    );

    const { rows: totals } = await pool.query(
      `SELECT COALESCE(sum(amount) FILTER (WHERE status = 'pending'), 0)::float AS total_pending,
              COALESCE(sum(amount) FILTER (WHERE status = 'deposited'), 0)::float AS total_deposited,
              COALESCE(sum(amount) FILTER (WHERE status = 'verified'), 0)::float AS total_verified
       FROM cash_settlements WHERE driver_id = $1`,
      [user.id]
    );

    return NextResponse.json({ settlements: rows, totals: totals[0] });
  } catch (err) {
    console.error('[driver settlements] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
