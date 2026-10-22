//app/dashboard/gudang/components/RequestCard.jsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Clock, MessageSquare, Package, User } from '@/lib/icons'

export default function RequestCard({ request, updateStatus, updatingId }) {
  const getStatusColor = (status) => {
    const colors = {
      Baru: 'bg-blue-50 text-blue-700',
      Diproses: 'bg-amber-50 text-amber-700',
      Selesai: 'bg-emerald-50 text-emerald-700',
      Dibatalkan: 'bg-red-50 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  // ✅ Actions sesuai constraint database
  const actions = [
    {
      label: 'Terima & Proses',
      nextStatus: 'Diproses',
      visible: request.status === 'Baru',
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    {
      label: 'Selesai',
      nextStatus: 'Selesai',
      visible: request.status === 'Diproses',
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      label: 'Batalkan',
      nextStatus: 'Dibatalkan', // ✅ Sesuai constraint
      visible: request.status === 'Baru' || request.status === 'Diproses',
      color: 'bg-white border border-red-300 text-red-600 hover:bg-red-50',
    },
  ]

  const isUpdating = updatingId === request.id

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-lg">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
              <User className="h-3.5 w-3.5 text-gray-400" />
              <span className="font-medium text-gray-900">{request.user_profiles?.full_name || 'Kasir'}</span>
            </div>
            <div className="font-mono text-xs text-gray-400">
              {request.request_number}
            </div>
          </div>
          <Badge className={`${getStatusColor(request.status)} text-xs font-medium px-2.5 py-0.5 rounded-full border-0`}>
            {request.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center text-gray-400 text-xs space-x-1.5">
          <Clock className="h-3 w-3" />
          <span>{new Date(request.created_at).toLocaleString('id-ID')}</span>
        </div>

        {request.message && (
          <div className="flex items-start space-x-2 bg-gray-50 border border-gray-200 rounded-md p-2.5">
            <MessageSquare className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-600 text-sm leading-snug">{request.message}</span>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-100 rounded-md p-3 space-y-2">
          <div className="flex items-center space-x-2 mb-1">
            <Package className="h-3.5 w-3.5 text-gray-400" />
            <p className="font-medium text-gray-700 text-xs uppercase tracking-wide">Daftar Item</p>
          </div>
          {request.request_items?.length > 0 ? (
            request.request_items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between text-sm text-gray-700 border-b border-gray-100 last:border-b-0 pb-1.5 last:pb-0"
              >
                <div className="flex flex-col">
                  <span className="font-mono text-sm text-gray-900">
                    {item.product_code}
                  </span>
                  <span className="text-xs text-gray-400">
                    {item.product_color} / {item.product_size}
                  </span>
                </div>
                <span className="font-medium text-gray-600 text-sm">
                  × {item.quantity}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">Tidak ada item.</p>
          )}
        </div>

        {/* Tombol aksi - hide jika sudah selesai/dibatalkan */}
        {request.status !== 'Selesai' && request.status !== 'Dibatalkan' && (
          <div className="flex flex-wrap gap-2 pt-1">
            {actions
              .filter((a) => a.visible)
              .map((action, i) => (
                <Button
                  key={i}
                  size="sm"
                  onClick={() => updateStatus(request.id, action.nextStatus)}
                  disabled={isUpdating}
                  className={`flex-1 text-xs ${action.color}`}
                >
                  {isUpdating ? 'Updating...' : action.label}
                </Button>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
