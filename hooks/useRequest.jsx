// hooks/useRequest.jsx

'use client'

import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * useRequests — Custom Hook untuk mengelola data permintaan
 * -----------------------------------------------------------
 * Meng-handle:
 * - Fetch requests dari tabel Supabase
 * - Update status request
 * - Realtime listener untuk perubahan tabel `requests`
 */
export function useRequests(role = 'gudang') {
  const supabase = createClient()
  const { toast } = useToast()

  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  // 🔹 Fetch semua request
  const fetchRequests = useCallback(async () => {
  setIsLoading(true)
  try {
    let query = supabase
      .from('requests')
      .select(`
        id, request_number, created_at, status,
        user_profiles(full_name, email),
        request_items(product_code, product_color, product_size, quantity)
      `)
      .order('created_at', { ascending: false })

    // Filter berdasarkan peran
    if (role === 'kasir' && userProfile?.id) {
      query = query.eq('kasir_id', userProfile.id) // Kasir hanya bisa melihat request yang mereka buat
    }

    // Gudang dapat melihat request dengan status tertentu
    if (role === 'gudang') {
      query = query.in('status', ['Baru', 'Diterima', 'Diproses', 'Selesai'])
    }

    const { data, error } = await query
    if (error) throw error
    setRequests(data || [])
  } catch (err) {
    toast({
      title: 'Fetch Error',
      description: err.message,
      variant: 'destructive',
    })
  } finally {
    setIsLoading(false)
  }
}, [supabase, toast, role, userProfile?.id])

  // 🔹 Update status permintaan
  const updateRequestStatus = useCallback(
    async (id, status) => {
      setUpdatingId(id)
      try {
        const { error } = await supabase.from('requests').update({ status }).eq('id', id)
        if (error) throw error

        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        )

        toast({
          title: 'Status Updated',
          description: `Request marked as ${status}`,
        })
      } catch (err) {
        toast({
          title: 'Update Error',
          description: err.message,
          variant: 'destructive',
        })
      } finally {
        setUpdatingId(null)
      }
    },
    [supabase, toast]
  )

  // 🔹 Listener realtime
  useEffect(() => {
    fetchRequests()

    const channel = supabase
      .channel(`requests-${role}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload) => {
          toast({
            title: '🔔 Request Changed',
            description: `Request ${payload.new.request_number || payload.old.id} updated.`,
          })
          fetchRequests()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchRequests, role])

  // 🔹 Statistik otomatis (memoized)
  const stats = useMemo(() => ({
    baru: requests.filter((r) => r.status === 'Baru').length,
    diterima: requests.filter((r) => r.status === 'Diterima').length,
    diproses: requests.filter((r) => r.status === 'Diproses').length,
    selesai: requests.filter((r) => r.status === 'Selesai').length,
    total: requests.length,
  }), [requests])

  return {
    requests,
    isLoading,
    updatingId,
    stats,
    fetchRequests,
    updateRequestStatus,
  }
}
