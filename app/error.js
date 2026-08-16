'use client';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function Error({ reset }) {
  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="driver-card text-center py-12 max-w-md w-full">
        <FaExclamationTriangle className="text-6xl text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-slate-400 text-sm mb-6">Please try again.</p>
        <button
          onClick={reset}
          className="px-8 py-3 rounded-full bg-emerald-500 text-slate-900 font-bold hover:bg-emerald-400 transition"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
