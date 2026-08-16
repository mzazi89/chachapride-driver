import { NextResponse } from 'next/server';
import { getSessionUser } from '../../../../lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    console.error('[me] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
