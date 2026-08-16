import { NextResponse } from 'next/server';
import pool from '../../../../../../lib/db';
import { guardDriver } from '../../../../../../lib/guard';

// Driver confirms they have deposited the commission to the owner's account
export async function POST(request, { params }) {
  const { user, response } = await guardDriver();
  if (response) return response;

  const { id } = params;

  try {
    const { rows } = await pool.query(
      `UPDATE cash_settlements SET status = 'deposited', deposited_at = now()
       WHERE id = $1 AND driver_id = $2 AND status = 'pending'
       RETURNING id, status, deposited_at`,
      [id, user.id]
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Settlement not found or already processed' },
        { status: 404 }
      );
    }
    return NextResponse.json({ settlement: rows[0] });
  } catch (err) {
    console.error('[driver deposit] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
