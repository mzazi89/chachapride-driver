export function haversineKm(lat1, lng1, lat2, lng2) {
  if (![lat1, lng1, lat2, lng2].every((v) => typeof v === 'number' && Number.isFinite(v))) {
    return null;
  }
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function estimatePrice(rideType, km) {
  const distanceKm = km ?? 5;
  return Math.round((rideType.basePrice + rideType.perKm * distanceKm) * 100) / 100;
}
