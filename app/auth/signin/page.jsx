'use client'

import { useAuth } from '@/components/AuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const data = await signIn(email, password)
      router.push('/dashboard')
    } catch (error) {
      // Terjemahkan pesan error Supabase ke bahasa Indonesia
      const msg = error.message || ''
      if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials')) {
        setError('Email atau password salah. Silakan coba lagi.')
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Email belum dikonfirmasi. Periksa inbox Anda.')
      } else if (msg.toLowerCase().includes('too many requests')) {
        setError('Terlalu banyak percobaan login. Coba lagi beberapa menit.')
      } else {
        setError(msg || 'Gagal masuk. Periksa kembali kredensial Anda.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-sm border border-gray-200 bg-white">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              <Image src="/logo.png" alt="JNCALI Logo" fill className="object-contain" />
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
                disabled={isLoading}
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
                disabled={isLoading}
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
