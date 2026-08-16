import { NextResponse } from 'next/server';
import { requireRole } from './auth';

export async function guardRole(...roles) {
  const { user, status } = await requireRole(...roles);
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: status === 403 ? 'Forbidden' : 'Unauthorized' },
        { status }
      ),
    };
  }
  return { user, response: null };
}

export async function guardDriver() {
  const { user, response } = await guardRole('driver');
  if (response) return { user: null, response };
  if (!user.driver?.approved) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Driver not approved yet' }, { status: 403 }),
    };
  }
  return { user, response: null };
}
