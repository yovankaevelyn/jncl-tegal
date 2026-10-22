//app/dashboard/page.jsx
'use client'

import { useAuth } from '@/components/AuthProvider'
import { Loader2 } from '@/lib/icons'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const dynamic = 'force-dynamic'
export default function Dashboard() {
  const router = useRouter()
  const { isLoading, userRole, user } = useAuth()

  useEffect(() => {
    console.log('📊 Dashboard - Loading:', isLoading, 'Role:', userRole)
    
    if (!isLoading) {
      if (!user) {
        console.log('❌ No user, redirecting to signin')
        router.push('/auth/signin')
        return
      }

      // Role-based routing
      if (userRole === 'Kasir') {
        console.log('✅ Redirecting to Kasir dashboard')
        router.push('/dashboard/kasir')
      } else if (userRole === 'Gudang') {
        console.log('✅ Redirecting to Gudang dashboard')
        router.push('/dashboard/gudang')
      } else if (userRole === 'Admin') {
        console.log('✅ Redirecting to Admin dashboard')
        router.push('/dashboard/products')
      } else {
        console.log('⏳ No role assigned, pending approval')
        router.push('/auth/pending-approval')
      }
    }
  }, [isLoading, userRole, user, router])

  return (
    <div className="flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
        <p className="text-gray-900 font-medium">Loading dashboard...</p>
        <p className="text-sm text-gray-500">Redirecting based on your role...</p>
      </div>
    </div>
  )
}
