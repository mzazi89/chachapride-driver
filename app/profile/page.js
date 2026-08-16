'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaSpinner,
  FaSave,
  FaPhone,
  FaIdCard,
  FaCar,
  FaHashtag,
} from 'react-icons/fa';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export default function DriverProfilePage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  const [driver, setDriver] = useState(null);
  const [form, setForm] = useState({ phone: '', license_number: '', vehicle_model: '', plate_number: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loading) return;
    const canDrive = !!user && (user.role === 'driver' || (user.role === 'owner' && !!user.driver));
    if (!canDrive) {
      router.replace('/login');
      return;
    }
    fetch('/api/driver/me')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setDriver(data.driver);
        setForm({
          phone: data.user.phone || '',
          license_number: data.driver.license_number || '',
          vehicle_model: data.driver.vehicle_model || '',
          plate_number: data.driver.plate_number || '',
        });
      })
      .catch((err) => setError(err.message));
  }, [loading, user, router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save changes');
      setDriver(data.driver);
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !driver) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-16 flex items-center justify-center text-slate-400">
          <FaSpinner className="animate-spin mr-2 text-emerald-400" /> Loading...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-extrabold text-white mb-6">My profile</h1>

        <div className="driver-card p-6">
          <p className="text-sm text-slate-400 mb-4">
            {user.name} · {user.email}
            {driver.approved ? (
              <span className="ml-2 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Approved
              </span>
            ) : (
              <span className="ml-2 text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Pending approval
              </span>
            )}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          {saved && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
              Saved successfully.
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <Field icon={FaPhone} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Phone number (riders call you)" type="tel" />
            <Field icon={FaIdCard} value={form.license_number} onChange={(v) => setForm({ ...form, license_number: v })} placeholder="Licence number" />
            <Field icon={FaCar} value={form.vehicle_model} onChange={(v) => setForm({ ...form, vehicle_model: v })} placeholder="Vehicle model" />
            <Field icon={FaHashtag} value={form.plate_number} onChange={(v) => setForm({ ...form, plate_number: v })} placeholder="Plate number" />

            <button
              type="submit"
              disabled={saving}
              className="driver-btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FaSave /> Save changes
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Field({ icon: Icon, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-4 focus-within:ring-2 focus-within:ring-emerald-500 border border-slate-700/60">
      <Icon className="text-slate-500 shrink-0" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent w-full outline-none text-white placeholder-slate-500"
      />
    </div>
  );
}
