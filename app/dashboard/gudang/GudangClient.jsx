// app/dashboard/gudang/GudangClient.jsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useRequestGudang from '@/hooks/useRequestGudang'
import { CheckCircle2, Clock, Inbox, Loader2, PackageX, Wifi, WifiOff } from '@/lib/icons'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import RequestCard from './components/RequestCard'

export default function GudangClient() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState(null)
  const [isConnected, setIsConnected] = useState(true)

  // Get user
  useEffect(() => {
    if (!supabase) return
    
    let mounted = true
    
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!mounted) return
        if (error) {
          console.error('auth.getUser error:', error)
          setUser(null)
          return
        }
        setUser(data?.user ?? null)
      } catch (error) {
        console.error('Error getting user:', error)
        if (mounted) setUser(null)
      }
    }
    
    getUser()
    
    return () => {
      mounted = false
    }
  }, [supabase])

  // Monitor connection
  useEffect(() => {
    if (!supabase) return

    const checkConnection = () => {
      const channels = supabase.getChannels()
      const connected = channels.some(ch => ch.state === 'joined')
      setIsConnected(connected)
    }

    checkConnection()
    const interval = setInterval(checkConnection, 5000)

    return () => clearInterval(interval)
  }, [supabase])

  const {
    requests,
    loading,
    updatingId,
    updateRequestStatus: updateStatus,
  } = useRequestGudang({ user })

  const safeRequests = Array.isArray(requests) ? requests : []

  // Filter by status
  const newRequests       = safeRequests.filter(r => r.status === 'Baru')
  const processingRequests = safeRequests.filter(r => r.status === 'Diproses')
  const completedRequests  = safeRequests.filter(r => r.status === 'Selesai')
  const cancelledRequests  = safeRequests.filter(r => r.status === 'Batal' || r.status === 'Dibatalkan')
  const activeRequests     = safeRequests.filter(r => r.status === 'Baru' || r.status === 'Diproses')

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Stats Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Aktif badge — highlight jika ada */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
            newRequests.length > 0
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <Clock className="h-3.5 w-3.5" />
            <span>{newRequests.length} Baru</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
            processingRequests.length > 0
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <Loader2 className="h-3.5 w-3.5" />
            <span>{processingRequests.length} Diproses</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-sm font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{completedRequests.length} Selesai</span>
          </div>
        </div>

        {/* Live indicator */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
          isConnected
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {isConnected ? (
            <><Wifi className="h-3.5 w-3.5" /><span>Live</span></>
          ) : (
            <><WifiOff className="h-3.5 w-3.5" /><span>Offline</span></>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="active" className="w-full">
        {/* Mobile: 2 baris tabs; Desktop: 1 baris 5 kolom */}
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto gap-1 p-1">
          <TabsTrigger value="active" className="relative text-xs sm:text-sm py-2">
            Aktif
            {activeRequests.length > 0 && (
              <span className="ml-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {activeRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="new" className="text-xs sm:text-sm py-2">
            Baru <span className="ml-1 opacity-70">({newRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="processing" className="text-xs sm:text-sm py-2">
            Proses <span className="ml-1 opacity-70">({processingRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm py-2 col-span-1">
            Selesai <span className="ml-1 opacity-70">({completedRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs sm:text-sm py-2 col-span-2 sm:col-span-1">
            Dibatal <span className="ml-1 opacity-70">({cancelledRequests.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeRequests.length === 0 ? (
            <EmptyState message="Tidak ada permintaan aktif" icon={<CheckCircle2 className="h-10 w-10 text-emerald-300" />} subtitle="Semua permintaan sudah diproses!" />
          ) : (
            <RequestGrid requests={activeRequests} updateStatus={updateStatus} updatingId={updatingId} />
          )}
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          {newRequests.length === 0 ? (
            <EmptyState message="Tidak ada permintaan baru" />
          ) : (
            <RequestGrid requests={newRequests} updateStatus={updateStatus} updatingId={updatingId} />
          )}
        </TabsContent>

        <TabsContent value="processing" className="mt-6">
          {processingRequests.length === 0 ? (
            <EmptyState message="Tidak ada permintaan yang sedang diproses" />
          ) : (
            <RequestGrid requests={processingRequests} updateStatus={updateStatus} updatingId={updatingId} />
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedRequests.length === 0 ? (
            <EmptyState message="Belum ada permintaan yang selesai" />
          ) : (
            <RequestGrid requests={completedRequests} updateStatus={updateStatus} updatingId={updatingId} />
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {cancelledRequests.length === 0 ? (
            <EmptyState message="Tidak ada permintaan yang dibatalkan" icon={<PackageX className="h-10 w-10 text-gray-300" />} />
          ) : (
            <RequestGrid requests={cancelledRequests} updateStatus={updateStatus} updatingId={updatingId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Helper Components ──

function EmptyState({
  message = 'Belum ada permintaan baru',
  subtitle = 'Permintaan dari kasir akan muncul di sini secara real-time.',
  icon = <Inbox className="h-10 w-10 text-gray-300" />,
}) {
  return (
    <Card className="h-[45vh] border border-dashed border-gray-300 bg-white">
      <CardContent className="w-full h-full flex flex-col items-center justify-center text-center space-y-3">
        {icon}
        <h2 className="text-gray-600 font-medium text-base">{message}</h2>
        <p className="text-gray-400 text-sm">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function RequestGrid({ requests, updateStatus, updatingId }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          updateStatus={updateStatus}
          updatingId={updatingId}
        />
      ))}
    </div>
  )
}
