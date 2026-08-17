import { NextResponse } from 'next/server';
import pool from '../../../../../../lib/db';
import { guardDriver } from '../../../../../../lib/guard';

export async function POST(request, { params }) {
  const { user, response } = await guardDriver();
  if (response) return response;

  const { id } = params;

  try {
    // Idempotent: declining the same ride twice is a no-op
    await pool.query(
      `INSERT INTO ride_declines (driver_id, ride_id) VALUES ($1, $2)
       ON CONFLICT (driver_id, ride_id) DO NOTHING`,
      [user.id, id]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    // If the ride_declines table is not migrated yet, still acknowledge the
    // decline — the app stops ringing it locally either way.
    if (!/ride_declines/.test(err.message)) {
      console.error('[driver decline] database error:', err.message);
      return NextResponse.json({ error: 'Database error.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }
}
