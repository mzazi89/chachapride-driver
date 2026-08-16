import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardDriver } from '../../../../lib/guard';

export async function POST(request) {
  const { user, response } = await guardDriver();
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Valid lat and lng are required' }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE rides SET driver_lat = $1, driver_lng = $2, driver_updated_at = now()
       WHERE driver_id = $3 AND status IN ('accepted', 'en_route')
       RETURNING id`,
      [lat, lng, user.id]
    );
    return NextResponse.json({ updated: rows.length });
  } catch (err) {
    console.error('[driver location] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
