import { NextResponse } from 'next/server';
import pool from '../../../../../../lib/db';
import { guardDriver } from '../../../../../../lib/guard';

const TRANSITIONS = {
  accepted: 'en_route',
  en_route: 'completed',
};

export async function POST(request, { params }) {
  const { user, response } = await guardDriver();
  if (response) return response;

  const { id } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const nextStatus = String(body.status ?? '');
  if (!['en_route', 'completed'].includes(nextStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'SELECT id, status, payment_method, commission FROM rides WHERE id = $1 AND driver_id = $2 FOR UPDATE',
        [id, user.id]
      );
      const ride = rows[0];
      if (!ride) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
      }
      if (TRANSITIONS[ride.status] !== nextStatus) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: `Cannot transition from ${ride.status} to ${nextStatus}` },
          { status: 400 }
        );
      }
      await client.query('UPDATE rides SET status = $1 WHERE id = $2', [nextStatus, id]);
      if (nextStatus === 'completed') {
        await client.query("UPDATE drivers SET status = 'available' WHERE user_id = $1", [user.id]);
        // Cash ride: driver must deposit the commission to the owner's account
        if (ride.payment_method === 'cash' && ride.commission != null) {
          await client.query(
            'INSERT INTO cash_settlements (driver_id, ride_id, amount) VALUES ($1, $2, $3)',
            [user.id, id, ride.commission]
          );
        }
      }
      await client.query('COMMIT');
      // New requests reach the freed driver via the incoming-call ring notification.
      return NextResponse.json({ ride: { id, status: nextStatus } });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[driver status] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
