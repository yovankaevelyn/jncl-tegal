//  hooks/useRequestGudang.js
'use client'

import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/utils/supabase/client'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useRequestGudang({ user } = {}) {
  const { toast } = useToast()
  const supabase = useRef(createClient()).current

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [items, setItems] = useState([])
  const [updatingId, setUpdatingId] = useState(null)
  
  const isMounted = useRef(true)
  const channelRef = useRef(null)

  // 🔹 Fetch requests dengan JOIN
  const fetchRequests = useCallback(async () => {
    if (!supabase) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          request_number,
          status,
          created_at,
          updated_at,
          kasir_id,
          message,
          user_profiles!kasir_id (
            full_name,
            email
          ),
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

      if (error) throw error

      if (!isMounted.current) return

      const safe = (Array.isArray(data) ? data : []).map((r) => ({
        ...r,
        request_items: Array.isArray(r?.request_items) ? r.request_items : [],
      }))

      setRequests(safe)
    } catch (error) {
      console.error('❌ Error fetching requests:', error)
      if (isMounted.current) {
        toast({
          title: 'Error memuat permintaan',
          description: error.message,
          variant: 'destructive',
        })
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [supabase, toast])

  // 🔹 Fetch items untuk request tertentu
  const fetchRequestItems = useCallback(
    async (requestId) => {
      if (!supabase) return

      try {
        const { data, error } = await supabase
          .from('request_items')
          .select('id, request_id, product_code, product_color, product_size, quantity')
          .eq('request_id', requestId)

        if (error) throw error
        if (isMounted.current) {
          setItems(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('❌ Error fetching request items:', error)
        if (isMounted.current) {
          toast({
            title: 'Error memuat item',
            description: error.message,
            variant: 'destructive',
          })
        }
      }
    },
    [supabase, toast]
  )

  // 🔹 Update status request dengan optimistic update
  const updateRequestStatus = useCallback(
    async (requestId, newStatus) => {
      if (!supabase) return

      try {
        setUpdatingId(requestId)

        // Optimistic update
        setRequests(prev =>
          prev.map(req =>
            req.id === requestId
              ? { ...req, status: newStatus, updated_at: new Date().toISOString() }
              : req
          )
        )

        const { error } = await supabase
          .from('requests')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', requestId)

        if (error) throw error

        toast({
          title: '✅ Status diperbarui',
          description: `Permintaan diubah menjadi "${newStatus}"`,
        })

        if (selectedRequest?.id === requestId) {
          await fetchRequestItems(requestId)
        }
      } catch (error) {
        console.error('❌ Error updating status:', error)
        
        // Rollback optimistic update on error
        await fetchRequests()
        
        toast({
          title: 'Gagal memperbarui status',
          description: error.message,
          variant: 'destructive',
        })
      } finally {
        setUpdatingId(null)
      }
    },
    [supabase, toast, selectedRequest, fetchRequestItems, fetchRequests]
  )

  // 🔹 Select request
  const selectRequest = useCallback(
    async (req) => {
      setSelectedRequest(req)
      if (req?.id) await fetchRequestItems(req.id)
    },
    [fetchRequestItems]
  )

  // 🔹 Setup realtime subscription
  useEffect(() => {
    if (!user || !supabase) return

    isMounted.current = true
    fetchRequests()

    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Single channel untuk semua perubahan
    const channel = supabase
      .channel('gudang-realtime-all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests'
        },
        (payload) => {
          console.log('🔔 Gudang: Request updated', payload.eventType, payload.new?.request_number)

          if (!isMounted.current) return

          if (payload.eventType === 'INSERT') {
            // Real-time INSERT
            toast({
              title: '📦 Permintaan Baru!',
              description: `${payload.new.request_number} dari kasir`,
            })
            
            // Fetch full detail
            setTimeout(fetchRequests, 500)
          }

          if (payload.eventType === 'UPDATE') {
            // Real-time UPDATE status
            setRequests(prev =>
              prev.map(req =>
                req.id === payload.new.id
                  ? { ...req, ...payload.new }
                  : req
              )
            )
          }

          if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(req => req.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_items'
        },
        (payload) => {
          console.log('🔔 Gudang: Items updated', payload.eventType)
          
          if (!isMounted.current) return

          if (selectedRequest?.id === payload.new?.request_id) {
            fetchRequestItems(selectedRequest.id)
          }

          setTimeout(fetchRequests, 300)
        }
      )
      .subscribe((status) => {
        console.log('📡 Gudang realtime status:', status)
      })

    channelRef.current = channel

    return () => {
      isMounted.current = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user, supabase, fetchRequests, selectedRequest, fetchRequestItems, toast])

  return {
    requests,
    loading,
    updatingId,
    selectedRequest,
    items,
    fetchRequests,
    selectRequest,
    updateRequestStatus,
  }
}