// app/dashboard/gudang/page.jsx
import dynamic from 'next/dynamic'

// ✅ Metadata
export const metadata = {
  title: 'Item Dispatch - JNCALI',
  description: 'Kelola permintaan dari kasir',
}

// ✅ Viewport (fix warning)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

// ✅ Load client component WITHOUT SSR
const GudangClient = dynamic(() => import('./GudangClient'), {
  ssr: false,
})

// ✅ SERVER COMPONENT - Renders INSTANTLY
export default function GudangPage() {
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* 
        ✅ LCP ELEMENT - Renders IMMEDIATELY on server
        This is static HTML, no JavaScript needed
      */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Daftar Permintaan Gudang
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pantau dan proses permintaan dari kasir secara real-time.
        </p>
      </div>

      {/* ✅ Client component loads AFTER hero */}
      <GudangClient />
    </div>
  )
}
