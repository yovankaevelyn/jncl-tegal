// app/dashboard/history/page.jsx
'use client'

import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/utils/supabase/client'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Import HistoryContent dengan SSR disabled
const HistoryContent = dynamic(() => import('./HistoryContent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600 absolute top-0"></div>
      </div>
    </div>
  )
})

export default function HistoryPage() {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const { userProfile, isKasir, isGudang, isAdmin } = useAuth()

  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  // Refs untuk tracking channels dan heartbeat
  const channelsRef = useRef([])
  const heartbeatIntervalRef = useRef(null)
  const lastFetchTimeRef = useRef(Date.now())
  const isFetchingRef = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchRequests = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return
    
    try {
      if (!supabase) return
      isFetchingRef.current = true
      setIsLoading(true)

      // Base query + nested request_items + user_profiles
      let query = supabase
        .from('requests')
        .select(`
          id,
          request_number,
          status,
          created_at,
          updated_at,
          kasir_id,
          message,
          user_profiles!requests_kasir_id_fkey ( full_name, email ),
          request_items (
            id,
            request_id,
            product_code,
            product_color,
            product_size,
            quantity
          )
        `)
        .order('created_at', { ascending: false })

      // Filter: kasir hanya melihat miliknya
      if (isKasir && userProfile?.id) {
        query = query.eq('kasir_id', userProfile.id)
      }

      const { data, error } = await query
      if (error) throw error

      // Guard agar request_items selalu array
      const safe = (Array.isArray(data) ? data : []).map((r) => ({
        ...r,
        request_items: Array.isArray(r?.request_items) ? r.request_items : [],
      }))

      setRequests(safe)
      lastFetchTimeRef.current = Date.now()
    } catch (err) {
      console.error('Error fetching requests:', err)
      toast({
        title: 'Error',
        description: 'Failed to load history',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [supabase, isKasir, userProfile?.id, toast])

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: 'Status updated',
        description: `Request status changed to ${newStatus}`,
      })

      await fetchRequests()
    } catch (err) {
      console.error('Error updating status:', err)
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      })
    }
  }

  // Initial fetch
  useEffect(() => {
    if (mounted) {
      fetchRequests()
    }
  }, [mounted, fetchRequests])

  // Setup realtime subscriptions dengan auto-reconnect
  useEffect(() => {
    if (!mounted || !supabase) return

    let isSubscribed = true

    const setupRealtimeChannels = async () => {
      // Cleanup existing channels
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []

      // Setup requests channel dengan heartbeat
      const chReq = supabase
        .channel('history-requests-realtime', {
          config: {
            broadcast: { self: true },
            presence: { key: 'history-page' }
          }
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'requests' },
          (payload) => {
            console.log('Requests change detected:', payload)
            if (isSubscribed) {
              setTimeout(() => fetchRequests(), 150)
            }
          }
        )
        .subscribe((status) => {
          console.log('Requests channel status:', status)
          
          // Auto-reconnect on error
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('Reconnecting requests channel...')
            setTimeout(() => {
              if (isSubscribed) {
                setupRealtimeChannels()
              }
            }, 2000)
          }
        })

      // Setup request_items channel dengan heartbeat
      const chItems = supabase
        .channel('history-request-items-realtime', {
          config: {
            broadcast: { self: true },
            presence: { key: 'history-page' }
          }
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'request_items' },
          (payload) => {
            console.log('Request items change detected:', payload)
            if (isSubscribed) {
              setTimeout(() => fetchRequests(), 150)
            }
          }
        )
        .subscribe((status) => {
          console.log('Request items channel status:', status)
          
          // Auto-reconnect on error
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('Reconnecting request items channel...')
            setTimeout(() => {
              if (isSubscribed) {
                setupRealtimeChannels()
              }
            }, 2000)
          }
        })

      channelsRef.current = [chReq, chItems]
    }

    setupRealtimeChannels()

    // Heartbeat untuk menjaga koneksi tetap hidup
    heartbeatIntervalRef.current = setInterval(() => {
      if (isSubscribed) {
        // Send presence heartbeat
        channelsRef.current.forEach(channel => {
          channel.track({ online_at: new Date().toISOString() })
        })
        
        // Refresh data setiap 30 detik untuk memastikan sinkronisasi
        const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current
        if (timeSinceLastFetch > 30000) {
          console.log('Heartbeat: refreshing data...')
          fetchRequests()
        }
      }
    }, 15000) // Heartbeat setiap 15 detik

    // Handle visibility change (tab inactive/active)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSubscribed) {
        console.log('Tab became visible, refreshing data...')
        fetchRequests()
        
        // Resubscribe channels untuk memastikan koneksi
        setupRealtimeChannels()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Handle online/offline
    const handleOnline = () => {
      if (isSubscribed) {
        console.log('Connection restored, refreshing data...')
        fetchRequests()
        setupRealtimeChannels()
      }
    }
    window.addEventListener('online', handleOnline)

    // Cleanup
    return () => {
      isSubscribed = false
      
      // Clear heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      
      // Remove channels
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []
      
      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
    }
  }, [mounted, supabase, fetchRequests])

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-6 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600 absolute top-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto">
        <HistoryContent
          requests={requests}
          isLoading={isLoading}
          isKasir={isKasir}
          isGudang={isGudang}
          isAdmin={isAdmin}
          userProfile={userProfile}
          updateRequestStatus={updateRequestStatus}
        />
      </div>
    </div>
  )
}