//app/dashboard/layout.js

import ErrorBoundary from '@/components/ErrorBoundary'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'
export const revalidate = 0
// ✅ CRITICAL: Don't block rendering with auth checks
export default function DashboardLayout({ children }) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="dashboard-container">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  )
}