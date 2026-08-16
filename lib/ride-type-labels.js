// Client-safe ride type constants (no DB imports) — for display labels only.
export const DEFAULT_RIDE_TYPES = [
  { id: 'uberx', name: 'UberX', icon: '🚗', base_price: 5, per_km: 1.2, capacity: 4, description: 'Affordable, everyday rides' },
  { id: 'uberxl', name: 'UberXL', icon: '🚐', base_price: 8, per_km: 1.8, capacity: 6, description: 'Rides for groups up to 6' },
  { id: 'comfort', name: 'Uber Comfort', icon: '🛻', base_price: 10, per_km: 2.1, capacity: 4, description: 'Extra legroom, top-rated drivers' },
  { id: 'green', name: 'Uber Green', icon: '🌿', base_price: 7, per_km: 1.5, capacity: 4, description: 'Eco-friendly electric vehicles' },
];

export function getDefaultRideType(id) {
  return DEFAULT_RIDE_TYPES.find((t) => t.id === id) || null;
}
