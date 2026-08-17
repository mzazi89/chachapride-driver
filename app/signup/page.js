'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaSpinner,
  FaIdCard,
  FaCar,
  FaHashtag,
  FaPhone,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

// Defined at module scope so its identity is stable — defining it inside the
// component would remount the input on every keystroke and lose focus.
const Field = ({ icon: Icon, ...props }) => (
  <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all duration-200">
    <Icon className="text-slate-500 shrink-0" />
    <input
      {...props}
      className="bg-transparent w-full outline-none text-white placeholder-slate-500"
    />
  </div>
);

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          role: 'driver',
          driverInfo: {
            license_number: licenseNumber,
            vehicle_model: vehicleModel,
            plate_number: plateNumber,
          },
        }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        // non-JSON response (e.g. proxy error page)
      }
      if (!res.ok) {
        setError(data.error || `Request failed (HTTP ${res.status})`);
        return;
      }
      await refresh();
      router.push('/');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center text-white flex items-start sm:items-center justify-center px-4 py-10" style={{ backgroundImage: `linear-gradient(rgba(15,23,42,0.85), rgba(15,23,42,0.93)), url(/images/hero-driver.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-2xl font-extrabold tracking-tight mb-8">
          chacha<span className="text-emerald-400">ride</span>
        </Link>
        <div className="driver-card">
          <h1 className="text-2xl font-extrabold">Become a driver</h1>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            Sign up to drive with chachapride. Your profile is reviewed by the owner before you can go online.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field
              icon={FaUser}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              minLength={2}
            />
            <Field
              icon={FaEnvelope}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
            />
            <Field
              icon={FaLock}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              required
              minLength={8}
            />

            <div className="pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Vehicle details
            </div>

            <Field
              icon={FaIdCard}
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="License number"
              required
            />
            <Field
              icon={FaCar}
              type="text"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="Vehicle model (e.g. Toyota Corolla)"
              required
            />
            <Field
              icon={FaHashtag}
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="Plate number"
              required
            />
            <Field
              icon={FaPhone}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number (riders will call you)"
              required
              pattern="[0-9+()\-\s]{7,}"
              title="Enter a valid phone number"
            />

            <button
              type="submit"
              disabled={loading}
              className="driver-btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Sign up as driver'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-emerald-400 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
