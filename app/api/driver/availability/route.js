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

  const status = String(body.status ?? '');
  if (!['available', 'offline'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE drivers SET status = $1 WHERE user_id = $2 RETURNING status',
      [status, user.id]
    );
    return NextResponse.json({ status: rows[0].status });
  } catch (err) {
    console.error('[driver availability] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
