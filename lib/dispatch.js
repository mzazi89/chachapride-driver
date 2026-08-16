import pool from './db';
import { haversineKm } from './pricing';

const DRIVE_SPEED_KMH = 30; // for ETA estimates

/**
 * Assigns the nearest available approved driver to an unassigned requested ride.
 * Returns the assignment or null.
 */
export async function dispatchRide(rideId) {
  const { rows: rides } = await pool.query(
    `SELECT id, pickup_lat, pickup_lng FROM rides
     WHERE id = $1 AND status = 'requested' AND driver_id IS NULL`,
    [rideId]
  );
  const ride = rides[0];
  if (!ride || ride.pickup_lat == null) return null;

  const { rows: drivers } = await pool.query(
    `SELECT dr.user_id, dr.lat, dr.lng
     FROM drivers dr
     WHERE dr.approved AND dr.status = 'available' AND dr.lat IS NOT NULL AND dr.lng IS NOT NULL
     ORDER BY dr.location_updated_at DESC NULLS LAST`
  );

  let best = null;
  let bestDist = Infinity;
  for (const d of drivers) {
    const dist = haversineKm(ride.pickup_lat, ride.pickup_lng, d.lat, d.lng);
    if (dist !== null && dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  if (!best) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: updated } = await client.query(
      `UPDATE rides SET driver_id = $1, status = 'accepted'
       WHERE id = $2 AND status = 'requested' AND driver_id IS NULL
       RETURNING id`,
      [best.user_id, rideId]
    );
    if (updated.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    await client.query("UPDATE drivers SET status = 'on_trip' WHERE user_id = $1", [best.user_id]);
    await client.query('COMMIT');
    return { rideId, driverId: best.user_id, distanceKm: bestDist, etaMinutes: Math.max(1, Math.round((bestDist / DRIVE_SPEED_KMH) * 60)) };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Runs dispatch for every unassigned requested ride (oldest first).
 * Returns total assignments made.
 */
export async function dispatchPendingRides() {
  const { rows } = await pool.query(
    `SELECT id FROM rides WHERE status = 'requested' AND driver_id IS NULL
     ORDER BY created_at ASC`
  );
  let assigned = 0;
  for (const ride of rows) {
    const result = await dispatchRide(ride.id);
    if (result) assigned += 1;
  }
  return assigned;
}
