'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaSpinner,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaShieldAlt,
} from 'react-icons/fa';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

import { fmtKsh as fmt } from '../../lib/format';

const STATUS_PILL = {
  pending: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  deposited: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  verified: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const STATUS_LABEL = { pending: 'Due', deposited: 'Deposited', verified: 'Verified' };

export default function SettlementsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    const canDrive = !!user && (user.role === 'driver' || (user.role === 'owner' && !!user.driver));
    if (!canDrive) {
      router.replace('/login');
      return;
    }
    fetchData();
  }, [authLoading, user, router]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/driver/settlements');
      if (!res.ok) throw new Error('Failed to load settlements');
      const j = await res.json();
      setData(j);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeposit = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/driver/settlements/${id}/deposit`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark deposit');
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-16 flex items-center justify-center text-slate-400">
          <FaSpinner className="animate-spin mr-2 text-emerald-400" /> Loading...
        </main>
      </div>
    );
  }

  const { settlements, totals } = data;

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <FaMoneyBillWave className="text-2xl text-emerald-400" />
          <h1 className="text-2xl font-extrabold text-white">Commission deposits</h1>
        </div>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          For cash rides, the customer pays you in cash. Deposit the{' '}
          <span className="text-emerald-400 font-semibold">commission</span> to
          the chachapride account, then mark it deposited — the owner verifies
          it.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard icon={FaClock} label="Due" value={fmt(totals.total_pending)} accent="text-amber-400" />
          <SummaryCard icon={FaCheckCircle} label="Deposited" value={fmt(totals.total_deposited)} accent="text-blue-400" />
          <SummaryCard icon={FaShieldAlt} label="Verified" value={fmt(totals.total_verified)} accent="text-emerald-400" />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {settlements.length === 0 ? (
          <div className="driver-card text-center py-12">
            <p className="text-3xl mb-3">💵</p>
            <p className="text-slate-200 font-semibold">No cash settlements yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Commissions for cash rides appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {settlements.map((s) => (
              <div key={s.id} className="driver-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">
                      {s.pickup} → {s.destination}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {s.ride_type} · fare {fmt(s.price)} ·{' '}
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                    <span
                      className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_PILL[s.status] || STATUS_PILL.pending}`}
                    >
                      {STATUS_LABEL[s.status] || s.status}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-extrabold text-white">{fmt(s.amount)}</p>
                    {s.status === 'pending' && (
                      <button
                        onClick={() => handleDeposit(s.id)}
                        disabled={busyId === s.id}
                        className="mt-2 px-4 py-1.5 rounded-full bg-emerald-500 text-slate-900 text-xs font-bold hover:bg-emerald-400 transition disabled:opacity-50"
                      >
                        {busyId === s.id ? <FaSpinner className="animate-spin" /> : 'Deposit done'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="driver-card p-5 flex items-center gap-3">
      <Icon className={`text-2xl ${accent}`} />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-extrabold text-white">{value}</p>
      </div>
    </div>
  );
}
