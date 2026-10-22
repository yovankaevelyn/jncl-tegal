//app/auth/signup/page.jsx
'use client'

import { useAuth } from '@/components/AuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Package } from '@/lib/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await signUp(email, password, fullName)
      setSuccess(true)
    } catch (error) {
      setError(error.message || 'Failed to sign up')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md shadow-sm border border-gray-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
                <Package className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-900">Registrasi Berhasil!</CardTitle>
            <CardDescription>
              Akun Anda telah dibuat dan menunggu persetujuan admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 text-sm">
              Anda akan dapat mengakses sistem setelah administrator menyetujui akun Anda.
            </p>
            <p className="text-sm text-gray-400">
              Silakan coba lagi nanti atau hubungi administrator Anda.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Kembali ke Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-sm border border-gray-200">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 text-white p-3 rounded-xl">
              <Package className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Buat Akun
          </CardTitle>
          <CardDescription className="text-base text-gray-500">Daftar ke sistem JNCALI</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-sm text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                Nama Lengkap
              </label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
                className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
            </div>
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
                className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
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
                minLength={6}
                className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Membuat akun...' : 'Daftar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Sudah punya akun?{' '}
            <Link href="/auth/signin" className="text-indigo-600 hover:underline font-medium">
              Masuk
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
