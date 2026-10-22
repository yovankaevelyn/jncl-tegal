//hooks/useRequestKasir.js  
'use client'

import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/utils/supabase/client'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useRequestKasir({ user }) {
  const { toast } = useToast()
  const supabase = useRef(createClient()).current

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const isMounted = useRef(true)
  const channelRef = useRef(null)

  // 🔹 Fetch requests dengan JOIN user_profiles
  const fetchRequests = useCallback(async () => {
    if (!user?.id || !supabase) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          request_number,
          status,
          message,
          created_at,
          updated_at,
          kasir_id,
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
        .eq('kasir_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (isMounted.current) {
        setRequests(
          (data || []).map((r) => ({
            ...r,
            request_items: Array.isArray(r?.request_items) ? r.request_items : [],
          }))
        )
      }
    } catch (err) {
      console.error('❌ fetchRequests error:', err)
      if (isMounted.current) {
        toast({
          title: 'Gagal memuat riwayat',
          description: err.message ?? 'Terjadi kesalahan saat memuat data.',
          variant: 'destructive',
        })
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [user?.id, supabase, toast])

  // 🔹 Create request
  const createRequest = useCallback(
    async ({ message = null, items = [] }) => {
      if (!user?.id) {
        toast({
          title: 'Sesi habis',
          description: 'Silakan login ulang.',
          variant: 'destructive',
        })
        return null
      }

      if (!items.length) {
        toast({
          title: 'Keranjang kosong',
          description: 'Tambahkan produk terlebih dahulu.',
          variant: 'destructive',
        })
        return null
      }

      try {
        const now = new Date()
        const request_number = `REQ-${now.getFullYear()}${String(
          now.getMonth() + 1
        ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${now.getTime().toString().slice(-6)}`

        const { data: newReq, error: reqErr } = await supabase
          .from('requests')
          .insert({
            request_number,
            kasir_id: user.id,
            status: 'Baru',
            message,
          })
          .select()
          .single()

        if (reqErr) throw reqErr

        const rows = items.map((it) => ({
          request_id: newReq.id,
          product_code: it.code,
          product_color: it.color ?? '-',
          product_size: it.size ?? '-',
          quantity: Number(it.quantity ?? 1),
        }))

        const { error: itemsErr } = await supabase.from('request_items').insert(rows)

        if (itemsErr) {
          await supabase.from('requests').delete().eq('id', newReq.id)
          throw itemsErr
        }

        toast({
          title: '✅ Permintaan terkirim',
          description: request_number,
        })

        // Optimistic update
        if (isMounted.current) {
          setRequests(prev => [{
            ...newReq,
            request_items: rows.map(r => ({
              product_code: r.product_code,
              product_color: r.product_color,
              product_size: r.product_size,
              quantity: r.quantity,
            })),
            user_profiles: {
              full_name: user.full_name,
              email: user.email
            }
          }, ...prev])
        }

        return newReq
      } catch (error) {
        console.error('❌ createRequest error:', error)
        toast({
          title: 'Gagal membuat permintaan',
          description: error.message ?? 'Terjadi kesalahan saat membuat request.',
          variant: 'destructive',
        })
        return null
      }
    },
    [toast, user, supabase]
  )

  // 🔹 Setup Realtime Subscription
  useEffect(() => {
    if (!user?.id || !supabase) return

    isMounted.current = true
    fetchRequests()

    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Single channel untuk kedua tabel
    const channel = supabase
      .channel(`kasir-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `kasir_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Request updated:', payload.eventType, payload.new?.request_number)
          
          if (!isMounted.current) return

          if (payload.eventType === 'INSERT') {
            // Skip - sudah optimistic update
            return
          }
          
          if (payload.eventType === 'UPDATE') {
            // Update status real-time
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
          console.log('🔔 Request items updated:', payload.eventType)
          // Fetch ulang untuk update items
          if (isMounted.current) {
            setTimeout(fetchRequests, 300)
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Kasir realtime status:', status)
      })

    channelRef.current = channel

    return () => {
      isMounted.current = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user?.id, supabase, fetchRequests])

  return { requests, loading, createRequest }
}