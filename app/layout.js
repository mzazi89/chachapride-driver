import './globals.css'
import { RideProvider } from './context/RideContext'
import { AuthProvider } from './context/AuthContext'
import RegisterSW from './components/RegisterSW'

export const metadata = {
  title: 'chachapride - Driver',
  description: 'Drive with chachapride — accept rides, track trips, and earn in real time.',
  applicationName: 'chachapride Driver',
  appleWebApp: {
    capable: true,
    title: 'chachapride Driver',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-gray-50">
        <RegisterSW />
        <AuthProvider>
          <RideProvider>
            {children}
          </RideProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
