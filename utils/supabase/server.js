// utils/supabase/server.js
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create a Supabase Server Client
 * Optimized for performance with minimal overhead
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Ignore - Server Component context
          }
        },
        remove(name, options) {
          try {
            cookieStore.delete(name, options)
          } catch {
            // Ignore - Server Component context
          }
        },
      },
      // ✅ Performance: Disable unnecessary features for server
      auth: {
        persistSession: false, // Server tidak perlu persist session
        autoRefreshToken: false, // Server tidak perlu auto-refresh
        detectSessionInUrl: false, // Server tidak parse URL
      },
    }
  )
}

// Alias untuk backward compatibility
export const createServerSupabaseClient = createClient