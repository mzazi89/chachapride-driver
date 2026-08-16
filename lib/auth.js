import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import pool from './db';

const COOKIE_NAME = 'session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function createSession(userId) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getSessionUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { rows } = await pool.query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
      [payload.sub]
    );
    const user = rows[0];
    if (!user) return null;
    if (user.role === 'driver') {
      const { rows: dr } = await pool.query(
        'SELECT id, license_number, vehicle_model, plate_number, status, approved FROM drivers WHERE user_id = $1',
        [user.id]
      );
      user.driver = dr[0] || null;
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Returns { user, status } — status is 200 on success, 401 when unauthenticated,
 * 403 when authenticated but role not allowed.
 */
export async function requireRole(...roles) {
  const user = await getSessionUser();
  if (!user) return { user: null, status: 401 };
  if (!roles.includes(user.role)) return { user: null, status: 403 };
  return { user, status: 200 };
}

export function clearSession() {
  cookies().set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
