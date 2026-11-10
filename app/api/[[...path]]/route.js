// app/api/[[...path]]/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/utils/supabase/server';

// Helper function to handle CORS
// ✅ Tidak ada fallback '*' — jika CORS_ORIGINS tidak di-set,
// tidak ada CORS header yang ditambahkan (same-origin only)
function handleCORS(response) {
  const allowedOrigins = process.env.CORS_ORIGINS
  if (!allowedOrigins) {
    // Same-origin only — browser akan block cross-origin requests
    return response
  }
  response.headers.set('Access-Control-Allow-Origin', allowedOrigins)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// Authenticate request menggunakan Supabase session
async function authenticateRequest() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return { user: null, supabase }
    return { user, supabase }
  } catch {
    return { user: null, supabase: null }
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Public routes — health check (tidak perlu auth)
    if ((route === '/root' || route === '/') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Hello World" }))
    }

    // Semua route lain WAJIB authenticated
    const { user, supabase } = await authenticateRequest()
    if (!user || !supabase) {
      return handleCORS(NextResponse.json(
        { error: "Unauthorized — silakan login terlebih dahulu" },
        { status: 401 }
      ))
    }

    // ✅ MIGRATED: Status endpoints sekarang menggunakan Supabase
    // (menggantikan MongoDB — satu dependency database lebih sedikit)

    // Status endpoints - POST /api/status
    if (route === '/status' && method === 'POST') {
      const body = await request.json()
      
      if (!body.client_name) {
        return handleCORS(NextResponse.json(
          { error: "client_name is required" }, 
          { status: 400 }
        ))
      }

      const statusObj = {
        id: uuidv4(),
        client_name: body.client_name,
        user_id: user.id,
        timestamp: new Date().toISOString()
      }

      const { error } = await supabase
        .from('status_checks')
        .insert(statusObj)

      if (error) throw error

      return handleCORS(NextResponse.json(statusObj))
    }

    // Status endpoints - GET /api/status
    if (route === '/status' && method === 'GET') {
      const { data, error } = await supabase
        .from('status_checks')
        .select('id, client_name, user_id, timestamp')
        .order('timestamp', { ascending: false })
        .limit(10000)

      if (error) throw error
      
      return handleCORS(NextResponse.json(data || []))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
