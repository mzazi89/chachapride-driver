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
  const { user, response } = await guardRole('driver', 'owner');
  if (response) return { user: null, response };
  // Owner can operate as a driver (profile auto-provisioned via /api/auth/ensure-driver)
  if (user.role === 'owner') {
    if (!user.driver) {
      return {
        user: null,
        response: NextResponse.json({ error: 'No driver profile. Login again as owner.' }, { status: 403 }),
      };
    }
    return { user, response: null };
  }
  if (!user.driver?.approved) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Driver not approved yet' }, { status: 403 }),
    };
  }
  return { user, response: null };
}
