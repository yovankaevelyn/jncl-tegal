// app/dashboard/kasir/page.jsx
// SERVER COMPONENT 
import dynamic from 'next/dynamic'

// Load heavy component without SSR
const KasirClient = dynamic(() => import('./KasirClient'), {
  ssr: false,
  loading: () => (
    <div className="p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* LCP Element - loads immediately */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">
            Point of Request
          </h1>
          <p className="text-sm text-gray-500">Buat dan kelola permintaan barang ke gudang</p>
        </div>
        
        {/* Skeleton loader */}
        <div className="animate-pulse space-y-4">
          <div className="h-11 bg-gray-200 rounded-lg w-full"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="lg:col-span-1">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function KasirPage() {
  return <KasirClient />
}
