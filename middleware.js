// middleware.js
// Middleware ringan tanpa import Supabase — cek session via cookie saja
// Tidak ada Node.js API → aman di Edge Runtime (tidak ada warning build)
import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Skip middleware untuk static files, API routes & public display
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/display') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const isAuthPath = pathname.startsWith('/auth')
  const isDashboardPath = pathname.startsWith('/dashboard')

  // Cek keberadaan session cookie Supabase
  // Cookie Supabase biasanya bernama: sb-<project-ref>-auth-token
  // atau auth-token (tergantung konfigurasi)
  const cookies = request.cookies
  const hasSession = [...cookies.getAll()].some(
    (c) =>
      c.name.startsWith('sb-') &&
      (c.name.endsWith('-auth-token') || c.name.endsWith('-auth-token.0') || c.name.endsWith('-auth-token.1'))
  )

  // Redirect ke signin jika tidak ada session dan mencoba akses dashboard
  if (!hasSession && isDashboardPath) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Redirect ke dashboard jika sudah login dan mencoba akses halaman auth
  // (kecuali pending-approval)
  if (hasSession && isAuthPath && pathname !== '/auth/pending-approval') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (extensions)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
