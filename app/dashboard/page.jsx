//app/dashboard/page.jsx
'use client'

import { useAuth } from '@/components/AuthProvider'
import { Loader2 } from '@/lib/icons'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function Dashboard() {
  const router = useRouter()
  const { isLoading, userRole, user, isReady } = useAuth()
  const [timedOut, setTimedOut] = useState(false)
  const timeoutRef = useRef(null)

  // Failsafe: jika setelah 25 detik masih loading → paksa ke signin
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setTimedOut(true)
      router.push('/auth/signin')
    }, 25000)

    return () => clearTimeout(timeoutRef.current)
  }, [router])

  // Redirect berdasarkan role saat auth selesai
  useEffect(() => {
    console.log('📊 Dashboard - Loading:', isLoading, 'Ready:', isReady, 'Role:', userRole)

    if (!isLoading && isReady) {
      // Batalkan failsafe timeout karena auth sudah selesai
      clearTimeout(timeoutRef.current)

      if (!user) {
        console.log('❌ No user, redirecting to signin')
        router.push('/auth/signin')
        return
      }

      // Role-based routing
      if (userRole === 'Kasir') {
        router.push('/dashboard/kasir')
      } else if (userRole === 'Gudang') {
        router.push('/dashboard/gudang')
      } else if (userRole === 'Admin') {
        router.push('/dashboard/products')
      } else {
        router.push('/auth/pending-approval')
      }
    }
  }, [isLoading, isReady, userRole, user, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center space-y-4">
        {timedOut ? (
          <>
            <p className="text-gray-600 font-medium">Koneksi lambat, mengalihkan ke login...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
            <p className="text-gray-900 font-medium">Loading dashboard...</p>
            <p className="text-sm text-gray-500">Memuat sesi pengguna...</p>
          </>
        )}
      </div>
    </div>
  )
}
