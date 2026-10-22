// app/dashboard/history/HistoryContent.jsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, History, Maximize, Minimize } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function HistoryContent({
  requests = [],
  isLoading = false,
  isKasir = false,
  isGudang = false,
  isAdmin = false,
  userProfile = null,
  updateRequestStatus,
}) {
  const [statusFilter, setStatusFilter] = useState('active')
  const [filteredRequests, setFilteredRequests] = useState([])
  const [displayedItems, setDisplayedItems] = useState(10)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const tableContainerRef = useRef(null)
  const cardRef = useRef(null)
  const itemsPerLoad = 10

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let filtered = requests
    
    if (statusFilter === 'active') {
      filtered = requests.filter((r) => r.status === 'Baru' || r.status === 'Diproses')
    } else if (statusFilter === 'completed') {
      filtered = requests.filter((r) => r.status === 'Selesai' || r.status === 'Batal')
    }
    
    const statusOrder = { 'Baru': 1, 'Diproses': 2, 'Selesai': 3, 'Batal': 4 }
    filtered.sort((a, b) => {
      const orderA = statusOrder[a.status] || 999
      const orderB = statusOrder[b.status] || 999
      if (orderA !== orderB) return orderA - orderB
      return new Date(b.created_at) - new Date(a.created_at)
    })
    
    setFilteredRequests(filtered)
    setDisplayedItems(10)
  }, [statusFilter, requests])

  const currentRequests = filteredRequests.slice(0, displayedItems)
  const hasMore = displayedItems < filteredRequests.length

  const handleScroll = useCallback(() => {
    if (!tableContainerRef.current || isLoadingMore || !hasMore) return

    const container = tableContainerRef.current
    const { scrollTop, scrollHeight, clientHeight } = container
    
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      setIsLoadingMore(true)
      
      setTimeout(() => {
        setDisplayedItems(prev => Math.min(prev + itemsPerLoad, filteredRequests.length))
        setIsLoadingMore(false)
      }, 300)
    }
  }, [isLoadingMore, hasMore, filteredRequests.length])

  useEffect(() => {
    const container = tableContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const getStatusColor = (status) => {
    const colors = {
      'Baru': 'bg-blue-50 text-blue-700',
      'Diterima': 'bg-amber-50 text-amber-700',
      'Diproses': 'bg-amber-50 text-amber-700',
      'Selesai': 'bg-emerald-50 text-emerald-700',
      'Batal': 'bg-red-50 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const toggleFullscreen = () => {
    if (!mounted || !cardRef.current) return
    
    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      })
    }
  }

  useEffect(() => {
    if (!mounted) return
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [mounted])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return '--:--:--'
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Request History</h1>
          <p className="text-sm text-gray-500 mt-1">Track all request activities in real-time</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-1.5">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] border-0 bg-transparent text-gray-700 focus:ring-0 h-auto p-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Baru & Diproses</SelectItem>
                <SelectItem value="completed">Selesai & Batal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card 
        ref={cardRef}
        className={`overflow-hidden border border-gray-200 shadow-sm rounded-lg flex flex-col ${
          isFullscreen 
            ? 'fixed inset-0 z-50 rounded-none m-0 bg-white' 
            : 'bg-white'
        }`}
      >
        <CardHeader className={`border-b border-gray-200 flex-shrink-0 bg-white`}>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="text-gray-900 font-semibold">Daftar Permintaan</span>
            <div className="flex items-center gap-3">
              <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {currentRequests.length} of {filteredRequests.length}
              </span>
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
                size="sm"
              >
                {isFullscreen ? (
                  <>
                    <Minimize className="h-4 w-4 mr-2" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize className="h-4 w-4 mr-2" />
                    Fullscreen
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className={`p-0 flex-1 overflow-hidden flex flex-col ${
          isFullscreen ? 'h-[calc(100vh-80px)]' : ''
        }`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600"></div>
              <p className="mt-4 text-gray-500 text-sm">Loading data...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className={`flex flex-col items-center justify-center ${isFullscreen ? 'h-full' : 'py-20'}`}>
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <History className="h-10 w-10 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm">Belum Ada Pesanan</p>
            </div>
          ) : (
            <div className={`flex flex-col ${isFullscreen ? 'h-full' : 'max-h-[600px]'}`}>
              {/* Fixed Header Table */}
              <div className="flex-shrink-0 border-b border-gray-200 sticky top-0 z-10 bg-gray-50">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="w-[60px] min-w-[60px] max-w-[60px] text-center font-medium text-gray-600 text-xs uppercase tracking-wide py-3 px-4">No</th>
                      <th className="w-[25%] min-w-[200px] text-left font-medium text-gray-600 text-xs uppercase tracking-wide py-3 px-4">Pesan</th>
                      <th className="w-[20%] min-w-[180px] text-left font-medium text-gray-600 text-xs uppercase tracking-wide py-3 px-4">Tanggal & Waktu</th>
                      <th className="w-[35%] min-w-[250px] text-left font-medium text-gray-600 text-xs uppercase tracking-wide py-3 px-4">Items</th>
                      <th className="w-[120px] min-w-[120px] max-w-[120px] text-center font-medium text-gray-600 text-xs uppercase tracking-wide py-3 px-4">Status</th>
                    </tr>
                  </thead>
                </table>
              </div>
              
              {/* Scrollable Body Table */}
              <div 
                ref={tableContainerRef}
                className={`flex-1 overflow-y-auto min-h-0 bg-white`}
              >
                <table className="w-full">
                  <tbody>
                  {currentRequests.map((request, index) => (
                    <tr 
                      key={request.id} 
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="w-[60px] min-w-[60px] max-w-[60px] text-center py-3 px-4">
                        <div className="bg-gray-100 text-gray-600 font-medium w-7 h-7 rounded-md flex items-center justify-center mx-auto text-xs">
                          {index + 1}
                        </div>
                      </td>
                      
                      <td className="w-[25%] min-w-[200px] py-3 px-4">
                        <span className="font-medium text-gray-900 text-sm">{request.message || 'N/A'}</span>
                      </td>
                      
                      <td className="w-[20%] min-w-[180px] py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-gray-700">
                            {formatDate(request.created_at)}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {formatTime(request.created_at)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="w-[35%] min-w-[250px] py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {request.request_items && request.request_items.length > 0 ? (
                            <>
                              {request.request_items.slice(0, 3).map((item, idx) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium"
                                >
                                  {item.product_code}
                                </span>
                              ))}
                              {request.request_items.length > 3 && (
                                <span className="inline-flex px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs font-medium">
                                  +{request.request_items.length - 3}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">No items</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="w-[120px] min-w-[120px] max-w-[120px] text-center py-3 px-4">
                        <div className="flex justify-center">
                          <span className={`${getStatusColor(request.status)} px-2.5 py-0.5 text-xs font-medium rounded-full`}>
                            {request.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {isLoadingMore && (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-200 border-t-indigo-600"></div>
                          <span className="text-gray-400 text-sm">Loading more...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {!hasMore && filteredRequests.length > 10 && (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        <span className="text-gray-300 text-sm">— End of list —</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
