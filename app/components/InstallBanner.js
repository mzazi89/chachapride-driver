'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaDownload, FaTimes } from 'react-icons/fa';

/**
 * Shows an "Install app" prompt for logged-in users once the browser
 * signals the site is installable (beforeinstallprompt).
 */
export default function InstallBanner({ appName = 'chachapride Driver' }) {
  const { user, loading } = useAuth();
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setDismissed(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const show = !loading && !!user && !dismissed && !installed && !!deferred;
  if (!show) return null;

  const handleInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md animate-slide-up">
      <div className="flex items-center gap-3 bg-slate-900/95 backdrop-blur border border-slate-700 text-white rounded-2xl shadow-2xl px-4 py-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-lg shrink-0">
          <FaDownload />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">Install {appName} app</p>
          <p className="text-xs text-slate-400">Get ride rings even when the tab is open</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-bold hover:brightness-110 transition shrink-0"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-slate-400 hover:text-white shrink-0"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
}
