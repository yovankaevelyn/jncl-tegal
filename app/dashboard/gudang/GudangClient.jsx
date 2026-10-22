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
  const newRequests = safeRequests.filter(r => r.status === 'Baru')
  const processingRequests = safeRequests.filter(r => r.status === 'Diproses')
  const completedRequests = safeRequests.filter(r => r.status === 'Selesai')
  const cancelledRequests = safeRequests.filter(r => r.status === 'Batal' || r.status === 'Dibatalkan')

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{newRequests.length} Baru</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
            <Loader2 className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">{processingRequests.length} Diproses</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">{completedRequests.length} Selesai</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-emerald-600">Real-time Active</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-600">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Semua ({safeRequests.length})</TabsTrigger>
          <TabsTrigger value="new">Baru ({newRequests.length})</TabsTrigger>
          <TabsTrigger value="processing">Diproses ({processingRequests.length})</TabsTrigger>
          <TabsTrigger value="completed">Selesai ({completedRequests.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Batal ({cancelledRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {safeRequests.length === 0 ? (
            <EmptyState />
          ) : (
            <RequestGrid requests={safeRequests} updateStatus={updateStatus} updatingId={updatingId} />
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

// Helper Components
function EmptyState({ message = "Belum ada permintaan baru", icon = <Inbox className="h-10 w-10 text-gray-300" /> }) {
  return (
    <Card className="h-[50vh] border border-dashed border-gray-300 bg-white">
      <CardContent className="w-full h-full flex flex-col items-center justify-center text-center space-y-3">
        {icon}
        <h2 className="text-gray-600 font-medium text-base">{message}</h2>
        <p className="text-gray-400 text-sm">Permintaan dari kasir akan muncul di sini secara real-time.</p>
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
