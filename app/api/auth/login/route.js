import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '../../../../lib/db';
import { createSession } from '../../../../lib/auth';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at },
    });
  } catch (err) {
    console.error('[login] database error:', err.message);
    return NextResponse.json({ error: 'Database error. Check that DATABASE_URL is set and Neon is reachable.' }, { status: 500 });
  }
}
