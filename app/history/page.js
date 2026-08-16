'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSpinner, FaRoute, FaWallet, FaCalendarDay } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { getRideType } from '../../lib/ride-types';

const fmtMoney = (n) => `$${Number(n).toFixed(2)}`;
const fmtDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
const rideTypeLabel = (id) => {
  const t = getRideType(id);
  return t ? `${t.icon} ${t.type}` : id;
};

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'driver') {
      router.replace('/login');
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/driver/history');
        if (res.status === 403) {
          if (!cancelled) setError('Your driver account has not been approved yet.');
          return;
        }
        if (!res.ok) return;
        const d = await res.json();
        if (!cancelled) setData(d);
      } catch {
        // ignore transient errors
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'driver') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <FaSpinner className="animate-spin text-emerald-400 text-3xl" />
      </div>
    );
  }

  const summary = data?.summary;
  const cards = [
    { label: 'Total trips', value: String(summary?.trips ?? 0), icon: FaRoute },
    { label: 'Total earnings', value: fmtMoney(summary?.total_earnings ?? 0), icon: FaWallet },
    { label: "Today's earnings", value: fmtMoney(summary?.today_earnings ?? 0), icon: FaCalendarDay },
  ];
  const rides = data?.rides || [];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Earnings</h1>

        {error ? (
          <div className="driver-card text-center py-10">
            <p className="text-slate-300">{error}</p>
          </div>
        ) : !data ? (
          <div className="flex justify-center py-16">
            <FaSpinner className="animate-spin text-emerald-400 text-2xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {cards.map(({ label, value, icon: Icon }) => (
                <div key={label} className="driver-card">
                  <Icon className="text-emerald-400 text-lg mb-2" />
                  <p className="text-2xl font-extrabold text-white">{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Completed trips
            </h2>
            {rides.length === 0 ? (
              <div className="driver-card text-center py-12">
                <p className="text-3xl mb-3">🧾</p>
                <p className="text-slate-200 font-semibold">No completed trips yet</p>
                <p className="text-slate-500 text-sm mt-1">
                  Your earnings will show up here after your first trip.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rides.map((ride) => (
                  <div key={ride.id} className="driver-card flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {ride.pickup} <span className="text-slate-600">→</span> {ride.destination}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {fmtDate(ride.created_at)} · {rideTypeLabel(ride.ride_type)}
                      </p>
                    </div>
                    <span className="text-lg font-extrabold text-emerald-400 shrink-0">
                      {fmtMoney(ride.price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
