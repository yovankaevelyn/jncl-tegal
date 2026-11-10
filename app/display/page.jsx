// app/display/page.jsx
'use client'

import { createClient } from '@/utils/supabase/client'
import { Clock, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ── Clock — komponen terpisah agar re-render tiap detik tidak
//            menyentuh tabel utama (Fix #4)
function LiveClock() {
  const [time, setTime] = useState(null)

  useEffect(() => {
    setTime(new Date())
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fmtTime = (d) =>
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const fmtDate = (d) =>
    d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="text-right">
      <div
        suppressHydrationWarning
        className="text-4xl font-mono font-bold text-white tabular-nums leading-none"
      >
        {time ? fmtTime(time) : '--:--:--'}
      </div>
      <div suppressHydrationWarning className="text-xs text-gray-500 mt-0.5 tabular-nums">
        {time ? fmtDate(time) : '\u00A0'}
      </div>
    </div>
  )
}

/**
 * 📺 Display Board — Papan Antrian Digital
 *
 * Halaman publik (tanpa login) untuk ditampilkan di layar besar / TV.
 * Hanya menampilkan request "Baru" & "Diproses".
 * Request "Selesai"/"Batal" hilang SEKETIKA dari daftar aktif saat
 * realtime event diterima, lalu tampil fade-out 15 detik.
 *
 * Kolom: No · Jam · Barang · Status
 *
 * Optimasi:
 * - Polling diperlambat ke 15 detik (realtime sebagai jalur utama)
 * - Semua event realtime di-debounce 400 ms agar burst event tidak tumpuk
 * - UPDATE status ditangani langsung di state — TIDAK trigger fetch ulang
 * - INSERT & request_items change di-debounce, fetch 1x meski banyak event
 * - activeRows & allRows di-memoize agar tidak hitung ulang tiap render
 * - API hanya ambil kolom yang dipakai (hapus message, request_number, dsb)
 */
export default function DisplayPage() {
  const supabase = useMemo(() => createClient(), [])

  const [requests, setRequests]             = useState([])
  const [fadingRequests, setFadingRequests] = useState([])
  const [isConnected, setIsConnected]       = useState(false)
  const [lastUpdate, setLastUpdate]         = useState(null)
  // Reconnect counter — setiap increment memaksa useEffect setup ulang channel
  const [reconnectCount, setReconnectCount] = useState(0)
  // Set ID request yang baru masuk — untuk animasi flash
  const [newIds, setNewIds]                 = useState(new Set())
  const newIdTimersRef                      = useRef(new Map())

  const channelRef      = useRef(null)
  const isFetchingRef   = useRef(false)
  const fadingTimersRef = useRef(new Map())
  // Debounce timer untuk INSERT / request_items events
  const fetchDebounceRef = useRef(null)

  // ── Helpers (stabil, tidak buat ulang tiap render) ────────────────────────

  const formatTime = useCallback(
    (date) => new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    []
  )

  const formatTimeShort = useCallback(
    (date) => new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    []
  )

  // ── Animasi "baru masuk" — flash selama 3 detik ──────────────────────────

  const markAsNew = useCallback((id) => {
    if (!id || newIdTimersRef.current.has(id)) return
    setNewIds(prev => new Set([...prev, id]))
    const t = setTimeout(() => {
      setNewIds(prev => { const s = new Set(prev); s.delete(id); return s })
      newIdTimersRef.current.delete(id)
    }, 3_000)
    newIdTimersRef.current.set(id, t)
  }, [])

  // ── Fading ────────────────────────────────────────────────────────────────

  const handleFading = useCallback((request) => {
    const id = request.id
    if (!id || fadingTimersRef.current.has(id)) return

    setFadingRequests(prev => {
      if (prev.some(r => r.id === id)) return prev
      return [...prev, { ...request, _fading: true }]
    })

    const timer = setTimeout(() => {
      setFadingRequests(prev => prev.filter(r => r.id !== id))
      fadingTimersRef.current.delete(id)
    }, 15_000)

    fadingTimersRef.current.set(id, timer)
  }, [])

  // ── Fetch utama — dipanggil sesedikit mungkin ────────────────────────────

  const fetchRequests = useCallback(async () => {
    if (isFetchingRef.current) return
    try {
      isFetchingRef.current = true
      const res  = await fetch('/api/display', { cache: 'no-store' })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      const safe = Array.isArray(data) ? data : []

      setRequests(prev => {
        const prevIds = new Set(prev.map(r => r.id))
        const incoming = new Set(safe.map(r => r.id))
        // Request yang sudah hilang dari DB → pindah ke fading (pakai status aslinya)
        prev.forEach(r => {
          if (!incoming.has(r.id)) handleFading({ ...r, _displayStatus: r.status ?? 'Selesai' })
        })
        // Request yang benar-benar baru (tidak ada di prev) → animasi flash
        safe.forEach(r => {
          if (!prevIds.has(r.id)) markAsNew(r.id)
        })
        return safe
      })

      setLastUpdate(new Date())
    } catch (err) {
      console.error('Display fetch error:', err)
    } finally {
      isFetchingRef.current = false
    }
  }, [handleFading, markAsNew])

  // Fetch dengan debounce — panggil ini untuk INSERT / request_items events
  // Banyak event dalam 400 ms hanya menghasilkan 1 fetch
  const fetchDebounced = useCallback((delayMs = 400) => {
    clearTimeout(fetchDebounceRef.current)
    fetchDebounceRef.current = setTimeout(fetchRequests, delayMs)
  }, [fetchRequests])

  // ── Setup realtime + polling ──────────────────────────────────────────────

  useEffect(() => {
    fetchRequests()

    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel('display-board-v4')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests' },
        (payload) => {
          const updated   = payload.new
          const newStatus = updated?.status
          if (!updated?.id) return

          console.log('📺 UPDATE:', updated.id, '→', newStatus)

          if (newStatus === 'Selesai' || newStatus === 'Batal' || newStatus === 'Dibatalkan') {
            // Hapus dari active list SEKETIKA, pindah ke fading
            setRequests(prev => {
              const found = prev.find(r => r.id === updated.id)
              handleFading({ ...(found ?? updated), _displayStatus: newStatus, request_items: found?.request_items ?? [] })
              return prev.filter(r => r.id !== updated.id)
            })
            // ✅ Tidak perlu fetch ulang — sudah ditangani di state
          } else {
            // Status lain (misal Diproses): update field di state
            setRequests(prev =>
              prev.map(r => r.id === updated.id ? { ...r, ...updated } : r)
            )
            // ✅ Tidak perlu fetch ulang — cukup update field yang berubah
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'requests' },
        () => {
          // Request baru → fetch untuk dapat request_items-nya (debounced)
          fetchDebounced(500)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'requests' },
        (payload) => {
          if (payload.old?.id) {
            setRequests(prev => prev.filter(r => r.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'request_items' },
        () => {
          // Item berubah → debounced fetch agar banyak item dalam 1 request
          // tidak memicu banyak API call
          fetchDebounced(600)
        }
      )
      .subscribe((status) => {
        console.log('📺 Channel:', status)
        setIsConnected(status === 'SUBSCRIBED')

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('📺 Channel error/timeout — reconnect dalam 4 detik...')
          setTimeout(() => {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current)
              channelRef.current = null
            }
            // Increment → useEffect re-run → channel baru dibuat otomatis
            setReconnectCount(prev => prev + 1)
          }, 4_000)
        }
      })

    channelRef.current = channel

    // Polling diperlambat ke 15 detik — hanya safety-net jika realtime putus
    const pollInterval = setInterval(fetchRequests, 15_000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchRequests()
    }
    const handleOnline = () => fetchRequests()

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('online', handleOnline)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(fetchDebounceRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('online', handleOnline)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      fadingTimersRef.current.forEach(t => clearTimeout(t))
      fadingTimersRef.current.clear()
      newIdTimersRef.current.forEach(t => clearTimeout(t))
      newIdTimersRef.current.clear()
    }
  }, [supabase, fetchRequests, fetchDebounced, handleFading, reconnectCount])

  // Fullscreen (F11)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'F11') {
        e.preventDefault()
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {})
        else document.exitFullscreen().catch(() => {})
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // ── Style helpers (stabil) ────────────────────────────────────────────────

  const getRowStyle = useCallback((status, isFading, isNew) => {
    if (isFading) return 'opacity-20 bg-gray-900/30 pointer-events-none'
    if (isNew)    return 'bg-indigo-900/60 border-l-4 border-l-indigo-400 animate-pulse'
    switch (status) {
      case 'Diproses': return 'bg-amber-950/50 border-l-4 border-l-amber-400'
      case 'Baru':     return 'bg-blue-950/40  border-l-4 border-l-blue-500'
      default:         return 'bg-gray-900/20'
    }
  }, [])

  const getStatusBadge = useCallback((status) => {
    switch (status) {
      case 'Baru':     return 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
      case 'Diproses': return 'bg-amber-500 text-gray-950 shadow-lg shadow-amber-900/40'
      case 'Selesai':  return 'bg-emerald-600 text-white'
      case 'Batal':    return 'bg-red-600 text-white'
      default:         return 'bg-gray-700 text-gray-300'
    }
  }, [])

  const getStatusLabel = useCallback((status) => {
    switch (status) {
      case 'Baru':
        return (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-5 h-5 flex-shrink-0" />
            Menunggu
          </span>
        )
      case 'Diproses':
        return (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
            Diproses
          </span>
        )
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            Selesai
          </span>
        )
      case 'Batal':
        return (
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
            Batal
          </span>
        )
      default:
        return status
    }
  }, [])

  // ── Memoized computed rows ────────────────────────────────────────────────

  const activeRows = useMemo(() => {
    const order = { 'Diproses': 1, 'Baru': 2 }
    return [...requests].sort((a, b) => {
      const diff = (order[a.status] ?? 99) - (order[b.status] ?? 99)
      if (diff !== 0) return diff
      return new Date(a.created_at) - new Date(b.created_at)
    })
  }, [requests])

  const allRows = useMemo(
    () => [...activeRows, ...fadingRequests],
    [activeRows, fadingRequests]
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col select-none">

      {/* ── Header ── */}
      <header className="bg-gray-900 border-b-2 border-blue-600 px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Logo JN CALI TEGAL */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="JN Cali Tegal Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">JNCALI</h1>
            <p className="text-blue-400 text-sm font-medium tracking-wide uppercase">
              Papan Status Permintaan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-10">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm text-gray-300 font-medium">Menunggu</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="text-sm text-gray-300 font-medium">Diproses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-300 font-medium">Selesai</span>
            </div>
          </div>

          {/* Connection */}
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full transition-colors ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-sm font-medium text-gray-400">{isConnected ? 'Live' : 'Offline'}</span>
          </div>

          {/* Jam — komponen terpisah, re-render tiap detik tidak menyentuh tabel */}
          <LiveClock />
        </div>
      </header>

      {/* ── Tabel ── */}
      <main className="flex-1 overflow-hidden relative flex flex-col">

        {/* Body — scrollable, header sticky di dalam */}
        <div className="flex-1 overflow-y-auto relative">
          {allRows.length === 0 ? (
            /* absolute inset-0 — dijamin persis tengah apapun ukuran layar */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
              <div className="relative w-48 h-48 opacity-50">
                <Image src="/logo.png" alt="logo" fill className="object-contain" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-gray-300 text-3xl font-bold">Belum ada permintaan aktif</p>
                <p className="text-gray-500 text-lg">Permintaan baru akan muncul secara otomatis</p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <colgroup>
                <col className="w-[72px]" />
                <col className="w-[110px]" />
                <col />
                <col className="w-[220px]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
                <tr>
                  <th className="py-4 px-6 text-center text-base font-bold text-gray-400 uppercase tracking-widest">No</th>
                  <th className="py-4 px-6 text-left   text-base font-bold text-gray-400 uppercase tracking-widest">Jam</th>
                  <th className="py-4 px-6 text-left   text-base font-bold text-gray-400 uppercase tracking-widest">Barang</th>
                  <th className="py-4 px-6 text-center text-base font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {allRows.map((request, index) => {
                  const status   = request._displayStatus || request.status
                  const isFading = !!request._fading
                  const isNew    = !isFading && newIds.has(request.id)
                  const rowNum   = isFading ? null : activeRows.indexOf(request) + 1

                  return (
                    <tr
                      key={request.id ?? index}
                      className={`border-b border-gray-800/70 transition-all duration-700 ${getRowStyle(status, isFading, isNew)}`}
                    >
                      {/* No */}
                      <td className="py-6 px-6 text-center">
                        {rowNum !== null ? (
                          <div className={`
                            w-11 h-11 rounded-xl flex items-center justify-center mx-auto
                            text-2xl font-extrabold tabular-nums
                            ${status === 'Diproses' ? 'bg-amber-500 text-gray-950' : 'bg-indigo-600 text-white'}
                          `}>
                            {rowNum}
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto bg-emerald-900/40">
                            <span className="text-emerald-400 text-2xl font-bold">✓</span>
                          </div>
                        )}
                      </td>

                      {/* Jam */}
                      <td className="py-6 px-6">
                        <span className="text-xl font-mono font-semibold text-gray-200 tabular-nums">
                          {formatTimeShort(request.created_at)}
                        </span>
                      </td>

                      {/* Barang */}
                      <td className="py-6 px-6">
                        <div className="flex flex-wrap gap-2">
                          {request.request_items?.length > 0 ? (
                            request.request_items.map((item, idx) => (
                              <span
                                key={idx}
                                className={`
                                  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-semibold
                                  ${status === 'Diproses'
                                    ? 'bg-amber-900/60 text-amber-100 ring-1 ring-amber-700/50'
                                    : 'bg-gray-800 text-gray-100 ring-1 ring-gray-700/50'}
                                `}
                              >
                                <span className="font-mono font-bold text-indigo-300">{item.product_code}</span>
                                {item.product_color && item.product_color !== '-' && (
                                  <><span className="text-gray-500">·</span><span className="text-gray-300">{item.product_color}</span></>
                                )}
                                {item.product_size && item.product_size !== '-' && (
                                  <><span className="text-gray-500">·</span><span className="text-gray-300">{item.product_size}</span></>
                                )}
                                <span className="font-extrabold text-white ml-0.5">×{item.quantity}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-lg">—</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-6 px-6 text-center">
                        <span className={`
                          inline-flex items-center justify-center px-5 py-2.5 rounded-xl
                          text-xl font-extrabold tracking-wide whitespace-nowrap
                          ${getStatusBadge(status)}
                          ${status === 'Diproses' ? 'animate-pulse' : ''}
                        `}>
                          {getStatusLabel(status)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 border-t border-gray-800 px-8 py-3 flex items-center justify-between flex-shrink-0">
        <span className="text-sm text-gray-600 font-medium">JNCALI Warehouse Management System</span>
        <span suppressHydrationWarning className="text-sm text-gray-600">
          {lastUpdate ? `Diperbarui: ${formatTime(lastUpdate)}` : ''}
          {' · '}F11 untuk layar penuh
        </span>
        <span className="text-sm text-gray-600">{requests.length} permintaan aktif</span>
      </footer>
    </div>
  )
}
