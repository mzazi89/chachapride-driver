'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const firstName = (user?.name || 'Driver').trim().split(/\s+/)[0];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const linkClass = (href) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      pathname === href ? 'text-white bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-white">
          chacha<span className="text-emerald-400">ride</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className={linkClass('/')}>Work</Link>
          <Link href="/history" className={linkClass('/history')}>History</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <span className="text-sm text-slate-300 font-medium">{firstName}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>

        <button
          className="md:hidden text-white text-xl p-1"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 flex flex-col gap-1">
          <Link href="/" className={linkClass('/')} onClick={() => setOpen(false)}>Work</Link>
          <Link href="/history" className={linkClass('/history')} onClick={() => setOpen(false)}>History</Link>
          <div className="mt-2 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-300 font-medium">{firstName}</span>
            <button
              onClick={() => { setOpen(false); handleLogout(); }}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
