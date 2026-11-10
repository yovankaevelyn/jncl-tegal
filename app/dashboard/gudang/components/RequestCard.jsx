//app/dashboard/gudang/components/RequestCard.jsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Clock, MessageSquare, Package, User } from '@/lib/icons'

// Format waktu singkat: "09.46"
function formatTime(isoString) {
  if (!isoString) return '-'
  const d = new Date(isoString)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}.${mm}`
}

const STATUS_STYLE = {
  Baru:       'bg-blue-600 text-white',
  Diproses:   'bg-amber-500 text-white',
  Selesai:    'bg-emerald-600 text-white',
  Dibatalkan: 'bg-red-500 text-white',
  Batal:      'bg-red-500 text-white',
}

export default function RequestCard({ request, updateStatus, updatingId }) {
  const isUpdating = updatingId === request.id
  const isDone = request.status === 'Selesai' || request.status === 'Dibatalkan' || request.status === 'Batal'
  const statusStyle = STATUS_STYLE[request.status] || 'bg-gray-500 text-white'

  return (
    <Card className={`bg-white border shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden ${
      request.status === 'Baru' ? 'border-blue-200 ring-1 ring-blue-100' :
      request.status === 'Diproses' ? 'border-amber-200 ring-1 ring-amber-100' :
      'border-gray-200'
    }`}>

      {/* ── Status bar di atas ── */}
      <div className={`h-1.5 w-full ${
        request.status === 'Baru' ? 'bg-blue-500' :
        request.status === 'Diproses' ? 'bg-amber-500' :
        request.status === 'Selesai' ? 'bg-emerald-500' :
        'bg-red-400'
      }`} />

      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex justify-between items-start gap-2">
          {/* Nama kasir + nomor request */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-semibold text-gray-900 text-sm truncate">
                {request.user_profiles?.full_name || 'Kasir'}
              </span>
            </div>
            <div className="font-mono text-xs text-gray-400 ml-5">
              {request.request_number}
            </div>
          </div>

          {/* Badge status solid */}
          <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${statusStyle}`}>
            {request.status}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4 px-4 space-y-3">
        {/* Waktu singkat */}
        <div className="flex items-center text-gray-400 text-xs gap-1.5">
          <Clock className="h-3 w-3" />
          <span>{formatTime(request.created_at)}</span>
          {request.updated_at !== request.created_at && (
            <span className="text-gray-300">· diupdate {formatTime(request.updated_at)}</span>
          )}
        </div>

        {/* Pesan dari kasir */}
        {request.message && (
          <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-lg p-2.5">
            <MessageSquare className="h-3.5 w-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <span className="text-indigo-700 text-xs leading-snug">{request.message}</span>
          </div>
        )}

        {/* Daftar Item */}
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Package className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
              {request.request_items?.length || 0} Item
            </span>
          </div>
          {request.request_items?.length > 0 ? (
            request.request_items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-sm border-b border-gray-100 last:border-b-0 pb-1.5 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="font-mono font-semibold text-sm text-gray-900 truncate">
                    {item.product_code}
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.product_color} / {item.product_size}
                  </div>
                </div>
                <span className="font-bold text-gray-700 ml-2 flex-shrink-0">
                  ×{item.quantity}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-xs">Tidak ada item.</p>
          )}
        </div>

        {/* ── Tombol Aksi ── */}
        {!isDone && (
          <div className="space-y-2 pt-1">
            {/* Tombol utama — touch-friendly */}
            {request.status === 'Baru' && (
              <Button
                size="sm"
                onClick={() => updateStatus(request.id, 'Diproses')}
                disabled={isUpdating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11 touch-manipulation text-sm"
              >
                {isUpdating ? 'Memproses...' : '✓ Terima & Proses'}
              </Button>
            )}
            {request.status === 'Diproses' && (
              <Button
                size="sm"
                onClick={() => updateStatus(request.id, 'Selesai')}
                disabled={isUpdating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 touch-manipulation text-sm"
              >
                {isUpdating ? 'Menyimpan...' : '✓ Tandai Selesai'}
              </Button>
            )}
            {/* Tombol Batalkan — terpisah, kecil & pucat */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateStatus(request.id, 'Dibatalkan')}
              disabled={isUpdating}
              className="w-full h-8 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 touch-manipulation"
            >
              Batalkan permintaan ini
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
