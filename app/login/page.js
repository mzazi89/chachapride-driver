'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEnvelope, FaLock, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
      // Owner can operate as a driver: provision their driver profile on login
      if (data.user?.role === 'owner') {
        try {
          await fetch('/api/auth/ensure-driver', { method: 'POST' });
        } catch {
          // profile provisioning failure is non-fatal; work screen will show guidance
        }
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="uber-card">
          <h1 className="text-3xl font-extrabold mb-1">Welcome back</h1>
          <p className="text-gray-500 mb-6">Log in to request a ride</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500">
              <FaEnvelope className="text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-400"
              />
            </div>

            <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500">
              <FaLock className="text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="uber-button flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            New to chachapride?{' '}
            <Link href="/signup" className="font-semibold text-black hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
