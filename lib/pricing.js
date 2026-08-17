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

// ---- KES bracket fares (boda-boda model) ----
// Minimum trip 50 KSh (up to 2 km); 3 km = 70 KSh; beyond 3 km, +perKm per km.
// Electric bike per_km is 5 KSh less (25 vs 30).

export function fareFor(rideType, km) {
  const distance = typeof km === 'number' && Number.isFinite(km) ? km : 2;
  const perKm = Number(rideType.perKm ?? rideType.per_km) || 30;

  let fare;
  if (distance <= 2) {
    fare = 50;
  } else if (distance <= 3) {
    fare = 70;
  } else {
    fare = 70 + Math.ceil(distance - 3) * perKm;
  }
  return Math.max(50, fare);
}

// Late-night surge: 10:30 PM – 4:30 AM (Africa/Nairobi), fare x2
export function isSurgeTime(date = new Date()) {
  const t = new Date(
    date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })
  );
  const mins = t.getHours() * 60 + t.getMinutes();
  const start = 22 * 60 + 30; // 22:30
  const end = 4 * 60 + 30; // 04:30
  return mins >= start || mins < end;
}

export function finalFare(rideType, km, date = new Date()) {
  const base = fareFor(rideType, km);
  return isSurgeTime(date) ? base * 2 : base;
}

// Platform commission on a fare (cash rides: driver deposits this to the owner)
export function commissionFor(price) {
  const rate = Number(process.env.COMMISSION_RATE) || 0.2;
  return Math.round(price * rate * 100) / 100;
}
