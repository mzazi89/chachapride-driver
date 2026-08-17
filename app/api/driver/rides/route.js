import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { guardDriver } from '../../../../lib/guard';
import { haversineKm } from '../../../../lib/pricing';

const DEFAULT_RADIUS_KM = 10;

export async function GET(request) {
  const { user, response } = await guardDriver();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'requested';

    // Optional proximity filter: ?lat=..&lng=..&radius=..
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));
    const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
    const radiusKm = Number(searchParams.get('radius')) > 0
      ? Number(searchParams.get('radius'))
      : DEFAULT_RADIUS_KM;

    // Only unassigned requested rides, excluding any this driver already declined
    const { rows } = await pool.query(
      `SELECT r.id, r.pickup, r.destination, r.pickup_lat, r.pickup_lng,
              r.destination_lat, r.destination_lng, r.ride_type, r.price, r.created_at,
              u.name AS rider_name
       FROM rides r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.status = $1 AND r.driver_id IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM ride_declines d WHERE d.ride_id = r.id AND d.driver_id = $2
         )
       ORDER BY r.created_at ASC
       LIMIT 50`,
      [status, user.id]
    );

    let rides = rows;
    if (hasLocation) {
      rides = rows
        .map((r) => ({
          ...r,
          distanceKm:
            r.pickup_lat != null
              ? haversineKm(lat, lng, Number(r.pickup_lat), Number(r.pickup_lng))
              : null,
        }))
        .filter((r) => r.distanceKm !== null && r.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 10);
    }

    return NextResponse.json({ rides });
  } catch (err) {
    console.error('[driver rides] database error:', err.message);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
