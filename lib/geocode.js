// Client-side geocoding helpers backed by OpenStreetMap Nominatim.

export async function geocode(query) {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  return data.map((r) => ({
    label: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}

export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Reverse geocoding failed');
  const data = await res.json();
  return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
