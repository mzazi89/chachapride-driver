'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FaSpinner, FaMapMarkerAlt, FaFlagCheckered } from 'react-icons/fa';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import { getDefaultRideType } from '../lib/ride-type-labels';

const Map = dynamic(() => import('./components/Map'), { ssr: false });

const fmtMoney = (n) => `$${Number(n).toFixed(2)}`;
const rideTypeLabel = (id) => {
  const t = getDefaultRideType(id);
  return t ? `${t.icon} ${t.name}` : id;
};

export default function WorkPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  // driver status/approval from GET /api/driver/me
  const [driverMe, setDriverMe] = useState(null);
  // active trip from GET /api/driver/rides/mine (auto-dispatched)
  const [trip, setTrip] = useState(null);
  // last completed ride (completion screen)
  const [completedRide, setCompletedRide] = useState(null);

  const [toggleBusy, setToggleBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);

  // GPS
  const [position, setPosition] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const latestPosRef = useRef(null);

  // Owner can operate as a driver once their profile exists (auto-provisioned on login)
  const canDrive = !!user && (user.role === 'driver' || (user.role === 'owner' && !!user.driver));
  const approved = !!user?.driver?.approved || user?.role === 'owner';
  const available = driverMe?.driver?.status === 'available';

  // Guard: not logged in / cannot drive -> login
  useEffect(() => {
    if (loading) return;
    if (!user || !canDrive) {
      router.replace('/login');
    }
  }, [loading, user, canDrive, router]);

  // While awaiting approval, poll /api/auth/me so approval changes are picked up automatically
  useEffect(() => {
    if (!canDrive || approved) return;
    const id = setInterval(() => {
      refresh();
    }, 6000);
    return () => clearInterval(id);
  }, [canDrive, approved, refresh]);

  // Approved driver: poll /api/driver/me + /api/driver/rides/mine every 6s
  useEffect(() => {
    if (!canDrive || !approved) return;
    let cancelled = false;

    const fetchMe = async () => {
      try {
        const res = await fetch('/api/driver/me');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setDriverMe(data);
      } catch {
        // ignore transient network errors
      }
    };
    const fetchMine = async () => {
      try {
        const res = await fetch('/api/driver/rides/mine');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setTrip(data.ride);
      } catch {
        // ignore
      }
    };

    fetchMe();
    fetchMine();
    const meInt = setInterval(fetchMe, 6000);
    const mineInt = setInterval(fetchMine, 6000);
    return () => {
      cancelled = true;
      clearInterval(meInt);
      clearInterval(mineInt);
    };
  }, [canDrive, approved]);

  // GPS reporting: while online (available) report position so dispatch can
  // match the nearest driver; every 10s idle, every 3s during a trip
  useEffect(() => {
    if (!approved || !available) return;
    let cancelled = false;
    let watchId = null;
    let postInt = null;
    const intervalMs = trip ? 3000 : 10000;

    const onSuccess = (pos) => {
      if (cancelled) return;
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      latestPosRef.current = p;
      setPosition(p);
      setLocationDenied(false);
    };

    const onError = (err) => {
      // 1 === PERMISSION_DENIED
      if (err && err.code === 1) {
        setLocationDenied(true);
        if (watchId != null) navigator.geolocation.clearWatch(watchId);
        if (postInt) clearInterval(postInt);
      }
    };

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      });
      postInt = setInterval(async () => {
        const p = latestPosRef.current;
        if (!p || cancelled) return;
        try {
          await fetch('/api/driver/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
          });
        } catch {
          // ignore
        }
      }, intervalMs);
    } else {
      setLocationDenied(true);
    }

    return () => {
      cancelled = true;
      if (watchId != null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (postInt) clearInterval(postInt);
      latestPosRef.current = null;
    };
  }, [approved, available, trip?.id]);

  const toggleAvailability = async () => {
    setToggleBusy(true);
    try {
      const status = available ? 'offline' : 'available';
      const res = await fetch('/api/driver/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setDriverMe((prev) =>
        prev ? { ...prev, driver: { ...prev.driver, status: data.status } } : prev
      );
    } finally {
      setToggleBusy(false);
    }
  };

  const changeStatus = async (next) => {
    if (!trip) return;
    setStatusBusy(next);
    try {
      const res = await fetch(`/api/driver/rides/${trip.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      if (next === 'en_route') {
        setTrip((prev) => (prev ? { ...prev, status: 'en_route' } : prev));
      } else if (next === 'completed') {
        setCompletedRide(trip);
        setTrip(null);
      }
    } finally {
      setStatusBusy(null);
    }
  };

  const handleContinue = async () => {
    setCompletedRide(null);
    try {
      const res = await fetch('/api/driver/rides/mine');
      if (res.ok) {
        const data = await res.json();
        setTrip(data.ride);
      }
    } catch {
      // ignore
    }
  };

  // ----- Loading / guard -----
  if (loading || !user || !canDrive) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <FaSpinner className="animate-spin text-emerald-400 text-3xl" />
      </div>
    );
  }

  // ----- 1. Awaiting owner approval -----
  if (user.role === 'driver' && user.driver && !user.driver.approved) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Header />
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="driver-card text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl">
              ⏳
            </div>
            <h1 className="text-2xl font-bold">Awaiting owner approval</h1>
            <p className="mt-2 text-slate-400 text-sm leading-relaxed">
              Your driver account is under review. You will be able to go online as soon as the
              owner approves your profile.
            </p>

            <div className="mt-6 text-left bg-slate-900/70 rounded-xl border border-slate-700/60 p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-semibold text-white text-right">{user.driver.vehicle_model}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Plate number</span>
                <span className="font-semibold text-white text-right">{user.driver.plate_number}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">License</span>
                <span className="font-semibold text-white text-right">{user.driver.license_number}</span>
              </div>
            </div>

            <button onClick={() => refresh()} className="driver-btn-outline mt-6">
              Check status again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----- 4. Trip complete -----
  if (completedRide) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="driver-card text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl">
              ✅
            </div>
            <h1 className="text-2xl font-bold">Trip complete</h1>
            <p className="mt-2 text-3xl font-extrabold text-emerald-400">
              {fmtMoney(completedRide.price)} earned
            </p>
            <p className="mt-2 text-sm text-slate-400 truncate">
              {completedRide.pickup} → {completedRide.destination}
            </p>
            <button onClick={handleContinue} className="driver-btn-primary mt-8">
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----- 3. Active trip -----
  if (trip) {
    const pCoords =
      trip.pickup_lat != null
        ? { lat: Number(trip.pickup_lat), lng: Number(trip.pickup_lng) }
        : null;
    const dCoords =
      trip.destination_lat != null
        ? { lat: Number(trip.destination_lat), lng: Number(trip.destination_lng) }
        : null;

    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-8">
          {locationDenied && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-2">
              <span>⚠️</span>
              <span>
                Location is off — riders can&apos;t track you. Turn on location in browser
                settings.
              </span>
            </div>
          )}

          <div className="driver-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {rideTypeLabel(trip.ride_type)}
              </span>
              <span className="text-xl font-extrabold text-emerald-400">
                {fmtMoney(trip.price)}
              </span>
            </div>

            <div className="flex gap-3 text-sm">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                <div className="w-0.5 flex-1 bg-slate-700 my-1 min-h-8" />
                <div className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <p className="font-semibold text-white truncate">{trip.pickup}</p>
                <p className="text-slate-400 mt-6 truncate">{trip.destination}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between">
              <p className="text-sm text-slate-300">
                Status:{' '}
                <span className="font-semibold text-emerald-400">
                  {trip.status === 'accepted' ? 'Drive to pickup' : 'On trip'}
                </span>
              </p>
              <span className="text-xs text-slate-500">
                {trip.status === 'accepted' ? 'Pick up your rider' : 'Head to destination'}
              </span>
            </div>

            <div className="mt-4">
              {trip.status === 'accepted' ? (
                <button
                  onClick={() => changeStatus('en_route')}
                  disabled={statusBusy === 'en_route'}
                  className="driver-btn-primary flex items-center justify-center gap-2"
                >
                  {statusBusy === 'en_route' ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <>
                      <FaMapMarkerAlt />
                      <span>Start trip</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => changeStatus('completed')}
                  disabled={statusBusy === 'completed'}
                  className="driver-btn-primary flex items-center justify-center gap-2"
                >
                  {statusBusy === 'completed' ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <>
                      <FaFlagCheckered />
                      <span>Complete trip</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div
            className="mt-4 rounded-2xl overflow-hidden border border-slate-700/60 shadow-lg bg-slate-800"
            style={{ height: 320 }}
          >
            <Map
              pickupCoords={pCoords}
              destinationCoords={dCoords}
              driverLocation={position}
              showUser={false}
              interactive={false}
            />
          </div>
        </main>
      </div>
    );
  }

  // ----- 2. Idle: availability toggle + request queue -----
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Ready to work?</h1>
            <p className="text-slate-400 text-sm mt-1">
              {driverMe?.driver?.vehicle_model || 'Driver'} · {driverMe?.user?.name || user.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {available ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/60 border border-slate-600/60 text-slate-400 text-sm font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                Offline
              </span>
            )}
            <button
              onClick={toggleAvailability}
              disabled={toggleBusy}
              className="driver-btn-primary !w-auto px-6 py-2.5 text-sm flex items-center gap-2"
            >
              {toggleBusy && <FaSpinner className="animate-spin" />}
              {available ? 'Go offline' : 'Go online'}
            </button>
          </div>
        </div>

        {available && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Ride requests
            </h2>
            <div className="driver-card text-center py-12">
              <p className="text-3xl mb-3">🛰️</p>
              <p className="text-slate-200 font-semibold">Waiting for ride requests</p>
              <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                When a rider pays, the nearest available driver is matched
                automatically and the trip appears here. Stay online with
                location on to get matched.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
