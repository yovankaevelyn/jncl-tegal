// app/api/display/route.js
// ✅ Public API endpoint untuk Display Board
// Tidak memerlukan autentikasi — hanya return data request aktif (Baru & Diproses)
// Optimasi: hanya ambil kolom yang benar-benar dipakai di UI

import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('requests')
      .select(`
        id,
        status,
        created_at,
        request_items (
          product_code,
          product_color,
          product_size,
          quantity
        )
      `)
      .in('status', ['Baru', 'Diproses'])
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Display API error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Pastikan request_items selalu array
    const safe = (Array.isArray(data) ? data : []).map((r) => ({
      ...r,
      request_items: Array.isArray(r?.request_items) ? r.request_items : [],
    }))

    return NextResponse.json(safe, {
      headers: {
        // Tidak di-cache browser/CDN, tapi boleh revalidate setelah 5 detik
        // (polling client 15 detik, jadi ini aman)
        'Cache-Control': 'no-cache, must-revalidate',
      },
    })
  } catch (err) {
    console.error('Display API unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
