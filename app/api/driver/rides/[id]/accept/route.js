import { NextResponse } from 'next/server';
import pool from '../../../../../../lib/db';
import { guardDriver } from '../../../../../../lib/guard';

export async function POST(request, { params }) {
  const { user, response } = await guardDriver();
  if (response) return response;

  const { id } = params;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE rides SET status = 'accepted', driver_id = $1
         WHERE id = $2 AND status = 'requested' AND driver_id IS NULL
         RETURNING id, status, pickup, destination, ride_type, price`,
        [user.id, id]
      );
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'This ride is no longer available' }, { status: 409 });
      }
      await client.query("UPDATE drivers SET status = 'on_trip' WHERE user_id = $1", [user.id]);
      await client.query('COMMIT');
      return NextResponse.json({ ride: rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[driver accept] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
