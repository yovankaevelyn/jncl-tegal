// utils/supabase/client.js
'use client'

import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance = null

// ✅ Mock client untuk SSR/Build time
const createMockClient = () => ({
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => Promise.resolve({ data: [], error: null }),
        limit: () => Promise.resolve({ data: [], error: null }),
      }),
      order: () => ({
        abortSignal: () => Promise.resolve({ data: [], error: null }),
      }),
      abortSignal: () => Promise.resolve({ data: [], error: null }),
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signIn: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  channel: () => ({
    on: () => ({ on: () => ({ subscribe: () => 'ok' }) }),
  }),
  removeChannel: () => {},
})

export function createClient() {
  // ✅ Return mock saat di server (build time)
  if (typeof window === 'undefined') {
    return createMockClient()
  }

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Supabase environment variables are missing.')
    return createMockClient()
  }

  // Singleton pattern - reuse existing instance
  if (supabaseInstance) {
    return supabaseInstance
  }

  console.log('🔵 Creating Supabase Browser Client')
  
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-client-info': 'jncali-web',
        },
      },
    }
  )

  return supabaseInstance
}

export const getSupabaseClient = createClient