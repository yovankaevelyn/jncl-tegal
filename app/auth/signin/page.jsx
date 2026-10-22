'use client'

import { useAuth } from '@/components/AuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Package } from '@/lib/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // ✅ FIX HYDRATION: Wait for client mount
  const [isMounted, setIsMounted] = useState(false)
  
  const { signIn } = useAuth()
  const router = useRouter()

  // ✅ FIX HYDRATION: Only render after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔐 Attempting sign in...')
      const data = await signIn(email, password)
      
      console.log('✅ Sign in successful:', data.user?.email)
      
      // Redirect ke /dashboard
      router.push('/dashboard')
      router.refresh()
      
    } catch (error) {
      console.error('❌ Sign in error:', error)
      setError(error.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ FIX HYDRATION: Show nothing until mounted
  if (!isMounted) {
    return null
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-sm border border-gray-200 bg-white">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600 text-white p-4 rounded-2xl">
              <Package className="h-10 w-10" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold text-gray-900 tracking-tight">
            JNCALI
          </CardTitle>
          <CardDescription className="text-base text-gray-500 pt-2">
            Masuk ke akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-sm text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@example.com"
                className="h-11 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="h-11 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                autoComplete="current-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors border-0" 
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-gray-100 pt-6 pb-8">
          <p className="text-sm text-gray-500">
            Belum punya akun?{' '}
            <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors">
              Daftar sekarang
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
