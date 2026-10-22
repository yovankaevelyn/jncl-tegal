//app/components/Navbar.jsx
'use client'

import { History, LogOut, Package, ShoppingCart, Users, Warehouse } from '@/lib/icons'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Komponen untuk menampung data navigasi dan ikon.
 */
const navItems = ({ isAdmin, isKasir, isGudang }) => [
  ...(isKasir
    ? [
        {
          href: '/dashboard/kasir',
          icon: ShoppingCart,
          label: 'Point of Request',
          key: 'kasir',
        },
      ]
    : []),
  ...(isGudang
    ? [
        {
          href: '/dashboard/gudang',
          icon: Warehouse,
          label: 'Item Dispatch',
          key: 'gudang',
        },
      ]
    : []),
  ...(isAdmin
    ? [
        {
          href: '/dashboard/products',
          icon: Package,
          label: 'Products',
          key: 'products',
        },
        {
          href: '/dashboard/users',
          icon: Users,
          label: 'Users',
          key: 'users',
        },
      ]
    : []),
  {
    href: '/dashboard/history',
    icon: History,
    label: 'History',
    key: 'history',
  },
]

export default function Navbar() {
  const { user, signOut, userRole, profile } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Derive role booleans
  const isAdmin = userRole === 'Admin'
  const isKasir = userRole === 'Kasir'
  const isGudang = userRole === 'Gudang'

  const handleSignOut = async () => {
    if (isLoggingOut) {
      console.log('⏳ Already logging out...')
      return
    }

    setIsLoggingOut(true)
    console.log('🚪 Starting sign out...')

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      )

      await Promise.race([signOut(), timeoutPromise])
      
      console.log('✅ Signed out successfully')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      
      // Force redirect even on error
      router.push('/auth/signin')
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!user) {
    return null
  }

  const items = navItems({ isAdmin, isKasir, isGudang })

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo dan Navigasi */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity" 
              aria-label="JNCALI Dashboard"
            >
              <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <Package className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                JNCALI
              </span>
            </Link>
            
            {/* Nav Items */}
            <div className="hidden md:flex space-x-1">
              {items.map(({ href, icon: Icon, label, key }) => (
                <Link
                  key={key}
                  href={href}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === href
                      ? 'text-indigo-600 font-semibold bg-indigo-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                  prefetch={true}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Info Pengguna dan Tombol Keluar */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-right hidden sm:block">
              <div className="font-medium text-gray-900">
                {profile?.full_name || user.email}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {userRole || 'User'}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 space-y-1">
          {items.map(({ href, icon: Icon, label, key }) => (
            <Link
              key={key}
              href={href}
              className={cn(
                'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium',
                pathname === href
                  ? 'text-indigo-600 font-semibold bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
