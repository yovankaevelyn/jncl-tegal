// app/dashboard/history/components/RequestDetailsDialog.jsx
// 🎯 Dialog with Kasir info (moved from table)

'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User } from 'lucide-react'

export default function RequestDetailsDialog({
  isOpen,
  onOpenChange,
  request,
  getStatusColor,
  canUpdateStatus,
  availableStatuses,
  updateRequestStatus,
}) {
  if (!request) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Detail Permintaan</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Request Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Nomor Permintaan</p>
              <p className="font-mono font-semibold text-gray-900 mt-0.5">{request.request_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Status</p>
              <Badge className={`${getStatusColor(request.status)} border-0 mt-1`}>
                {request.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Dibuat</p>
              <p className="text-sm text-gray-700 mt-0.5">
                {new Date(request.created_at).toLocaleString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Terakhir Diperbarui</p>
              <p className="text-sm text-gray-700 mt-0.5">
                {new Date(request.updated_at).toLocaleString('id-ID', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* 🎯 Kasir Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-gray-200 p-2 rounded-full">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Diminta oleh</p>
                <p className="font-semibold text-gray-900">
                  {request.user_profiles?.full_name || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  {request.user_profiles?.email || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Daftar Item</p>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {(request.request_items ?? []).map((item) => (
                <div key={item.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-mono font-medium text-gray-900">{item.product_code}</p>
                    <p className="text-xs text-gray-400">
                      {item.product_color} / {item.product_size}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Qty</p>
                    <p className="font-bold text-gray-900">{item.quantity}</p>
                  </div>
                </div>
              ))}
              {!(request.request_items ?? []).length && (
                <div className="p-3 text-sm text-gray-400 text-center">
                  Tidak ada item.
                </div>
              )}
            </div>
          </div>

          {/* Message (if any) */}
          {request.message && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Pesan</p>
              <p className="text-sm text-gray-700">{request.message}</p>
            </div>
          )}

          {/* Status Update Actions */}
          {canUpdateStatus && availableStatuses.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Update Status</p>
              <div className="flex gap-2">
                {availableStatuses.map((status) => (
                  <Button
                    key={status}
                    onClick={() => {
                      updateRequestStatus(request.id, status)
                      onOpenChange(false)
                    }}
                    variant={status === 'Batal' ? 'destructive' : 'default'}
                    className={`flex-1 ${status !== 'Batal' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
                  >
                    Ubah ke {status}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
