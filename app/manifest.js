export default function manifest() {
  return {
    name: 'chachapride — Driver',
    short_name: 'Driver',
    description: 'Drive with chachapride — accept rides, track trips, and earn in real time.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#059669',
    categories: ['transportation', 'navigation'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
