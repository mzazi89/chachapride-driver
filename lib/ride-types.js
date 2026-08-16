import pool from './db';
import { DEFAULT_RIDE_TYPES, getDefaultRideType } from './ride-type-labels';

// Server-side ride type access (owner-managed via the ride_types table).
export { DEFAULT_RIDE_TYPES, getDefaultRideType };

export async function getActiveRideTypes() {
  const { rows } = await pool.query(
    `SELECT id, name, icon, base_price, per_km, capacity, description, active
     FROM ride_types WHERE active = TRUE ORDER BY base_price ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.name,
    icon: r.icon,
    basePrice: Number(r.base_price),
    perKm: Number(r.per_km),
    capacity: r.capacity,
    description: r.description,
  }));
}

export async function getRideType(id) {
  const { rows } = await pool.query(
    `SELECT id, name, icon, base_price, per_km, capacity, description, active
     FROM ride_types WHERE id = $1 AND active = TRUE`,
    [id]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    type: r.name,
    icon: r.icon,
    basePrice: Number(r.base_price),
    perKm: Number(r.per_km),
    capacity: r.capacity,
    description: r.description,
  };
}
