import Link from 'next/link';
import { FaRoad } from 'react-icons/fa';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cover bg-center flex items-center justify-center px-4" style={{ backgroundImage: `linear-gradient(rgba(15,23,42,0.85), rgba(15,23,42,0.93)), url(/images/hero-driver.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="driver-card text-center py-12 max-w-md w-full">
        <FaRoad className="text-6xl text-slate-600 mx-auto mb-4" />
        <h1 className="text-6xl font-black text-slate-700 mb-2">404</h1>
        <h2 className="text-xl font-bold text-white mb-2">Off the map</h2>
        <p className="text-slate-400 text-sm mb-6">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-full bg-emerald-500 text-slate-900 font-bold hover:bg-emerald-400 transition"
        >
          Back to work
        </Link>
      </div>
    </main>
  );
}
