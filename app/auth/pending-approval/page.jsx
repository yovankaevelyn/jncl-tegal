'use client'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from '@/lib/icons'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PendingApproval() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  // Redirect to signin if no user
  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
    }
  }, [user, router])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('❌ Error signing out:', error)
    }
  }

  if (!user) return null

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-sm border border-gray-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-100 text-amber-600 p-3 rounded-xl">
              <Clock className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-900">Menunggu Persetujuan</CardTitle>
          <CardDescription className="text-gray-500">
            Akun Anda sedang menunggu persetujuan administrator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600 text-sm">
              Terima kasih telah mendaftar di <span className="font-semibold text-gray-900">JNCALI</span>. Akun Anda telah dibuat tetapi memerlukan persetujuan dari administrator sebelum Anda dapat mengakses sistem.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Langkah selanjutnya:</strong><br />
                Silakan coba lagi nanti atau hubungi administrator Anda. Anda akan mendapatkan akses setelah akun Anda disetujui.
              </p>
            </div>
            <div className="text-sm text-gray-500 mt-4">
              Login sebagai: <span className="font-medium text-gray-700">{user.email}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Keluar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
