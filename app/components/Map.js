'use client';
import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRide } from '../context/RideContext';
import { reverseGeocode } from '../../lib/geocode';

const LAYERS = {
  streets: {
    name: 'Map',
    // Esri World Street Map — street + place names
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>',
  },
  satellite: {
    name: 'Satellite',
    // Esri satellite imagery + reference labels/roads overlays (reliable, no API key)
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    overlays: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    ],
    attribution: 'Tiles &copy; <a href="https://www.esri.com">Esri</a>',
  },
  terrain: {
    name: 'Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; <a href="https://www.esri.com">Esri</a>',
  },
};

const pickupIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const destinationIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const driverIcon = L.divIcon({
  className: '',
  html: '<div style="width:26px;height:26px;background:#2563eb;border:3px solid #fff;border-radius:8px 8px 8px 2px;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:13px">🚗</span></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 22],
});

const userIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 6px rgba(59,130,246,.25)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Follows a moving position (user or driver) and keeps the map centered on it
function MapFollower({ position, zoom }) {
  const map = useMap();
  const lastKey = useRef(null);

  useEffect(() => {
    if (!position) return;
    const key = `${position.lat.toFixed(4)},${position.lng.toFixed(4)}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    map.flyTo([position.lat, position.lng], zoom, { duration: 1.2 });
  }, [position?.lat, position?.lng, zoom, map]);

  return null;
}

function RouteLayer({ from, to }) {
  const [route, setRoute] = useState(null);
  const map = useMap();

  useEffect(() => {
    let cancelled = false;
    if (!from || !to) {
      setRoute(null);
      return;
    }

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from.lng},${from.lat};${to.lng},${to.lat}` +
      `?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.routes || data.routes.length === 0) return;
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRoute(coords);
        map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [from, to, map]);

  if (!route) return null;
  return (
    <Polyline positions={route} pathOptions={{ color: '#111827', weight: 4, opacity: 0.85 }} />
  );
}

function ClickHandler() {
  const { pickupCoords, setPickup, setDestination } = useRide();

  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      const label = await reverseGeocode(lat, lng).catch(
        () => `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      );
      if (!pickupCoords) {
        setPickup(label, { lat, lng });
      } else {
        setDestination(label, { lat, lng });
      }
    },
  });

  return null;
}

function LayerControl({ layer, onSelect }) {
  return (
    <div className="absolute top-3 left-3 z-[1000] flex rounded-lg overflow-hidden shadow-md bg-white text-xs border border-gray-200">
      {Object.entries(LAYERS).map(([key, cfg]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={
            layer === key
              ? 'px-3 py-1.5 font-semibold bg-gray-900 text-white'
              : 'px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition'
          }
        >
          {cfg.name}
        </button>
      ))}
    </div>
  );
}

/**
 * Interactive map. Reads pickup/destination from RideContext by default;
 * caller can override via props (used by the live trip tracker).
 * Layer switcher: Streets / Satellite / Terrain.
 */
export default function Map({
  pickupCoords: pOverride,
  destinationCoords: dOverride,
  driverLocation = null,
  showUser = true,
  interactive = true,
}) {
  const ctx = useRide();
  const pickupCoords = pOverride ?? ctx.pickupCoords;
  const destinationCoords = dOverride ?? ctx.destinationCoords;
  const { userLocation } = ctx;
  const [layer, setLayer] = useState('satellite');
  const tile = LAYERS[layer];

  // Center the map on the driver while on a trip, otherwise on the user
  const followPos = driverLocation || (showUser ? userLocation : null);

  return (
    <MapContainer
      center={[-1.396, 36.7521]}
      zoom={15}
      scrollWheelZoom
      className="h-full w-full z-0"
    >
      <TileLayer attribution={tile.attribution} url={tile.url} />
      {(tile.overlays || []).map((u) => (
        <TileLayer key={u} attribution={tile.attribution} url={u} />
      ))}
      {pickupCoords && (
        <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon} />
      )}
      {destinationCoords && (
        <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={destinationIcon} />
      )}
      {driverLocation && (
        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon} />
      )}
      {showUser && userLocation && (
        <>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={userLocation.accuracy || 50}
            pathOptions={{ color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.08 }}
          />
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
        </>
      )}
      <RouteLayer from={pickupCoords} to={destinationCoords} />
      {interactive && <ClickHandler />}
      <MapFollower position={followPos} zoom={16} />
      <LayerControl layer={layer} onSelect={setLayer} />
    </MapContainer>
  );
}
