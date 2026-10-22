// app/layout.js
import { Inter } from "next/font/google"
import "./globals.css"

import { AuthProvider } from '@/components/AuthProvider'
import { Toaster } from '@/components/ui/toaster'


// ✅ Optimized font loading
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700'], // Only load weights you use
  fallback: ['system-ui', 'arial'], // Faster fallback
})

// ✅ Metadata
export const metadata = {
  title: "JNCALI - Warehouse Management",
  description: "Point of Request & Item Dispatch System",
  manifest: '/manifest.json', // If you have PWA
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
        className={`${inter.variable} antialiased`}
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
