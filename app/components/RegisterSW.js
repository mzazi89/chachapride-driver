'use client';
import { useEffect } from 'react';

/** Registers the service worker (production only). */
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // ignore — the app still works without a service worker
    });
  }, []);
  return null;
}
