// app/layout.js
import "./globals.css"

import { AuthProvider } from '@/components/AuthProvider'
import { Toaster } from '@/components/ui/toaster'

// ✅ Metadata
export const metadata = {
  title: "JNCALI - Warehouse Management",
  description: "Point of Request & Item Dispatch System",
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

// ✅ Viewport
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#4f46e5',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* ✅ Critical: Preconnect to Supabase */}
        <link rel="preconnect" href="https://mtbihkcfeniydkgkyskt.supabase.co" />
        <link rel="dns-prefetch" href="https://mtbihkcfeniydkgkyskt.supabase.co" />
      </head>
      <body 
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
