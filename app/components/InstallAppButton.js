'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaDownload, FaTimes } from 'react-icons/fa';

const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

/**
 * "Install app" button that works on every device:
 * - Chrome/Edge/Android: uses the native beforeinstallprompt
 * - iOS Safari and other browsers: shows step-by-step Add-to-Home-Screen instructions
 */
export default function InstallAppButton({ appName = 'chachapride Driver', variant = 'dark' }) {
  const { user, loading } = useAuth();
  const [deferred, setDeferred] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setDeferred(null);
      setShowModal(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (loading || !user) return null;

  const handleClick = async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else {
      setShowModal(true);
    }
  };

  const btnClass =
    variant === 'dark'
      ? 'bg-slate-800/70 hover:bg-slate-700 text-white border border-slate-700'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200';

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${btnClass}`}
      >
        <FaDownload className="text-xs" />
        Install app
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold">Install {appName}</h3>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close"
                className="text-slate-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            {isIOS() ? (
              <ol className="space-y-3 text-sm text-slate-300 list-decimal list-inside">
                <li>
                  Tap the <b>Share</b> button (square with an arrow) in the browser toolbar.
                </li>
                <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                <li>
                  Tap <b>Add</b> (top right), then open {appName} from your home screen like an app.
                </li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm text-slate-300 list-decimal list-inside">
                <li>
                  On <b>Android</b>: open the browser menu (⋮) and tap <b>Install app</b> or{' '}
                  <b>Add to Home screen</b>.
                </li>
                <li>
                  On <b>Chrome/Edge desktop</b>: click the install icon (monitor with a down arrow)
                  in the address bar.
                </li>
                <li>
                  On <b>other browsers</b>: use the browser&apos;s <b>Add to Home screen</b>{' '}
                  option from the menu.
                </li>
              </ol>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold hover:brightness-110 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
