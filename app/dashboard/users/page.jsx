//app/dashboard/users/page.jsx
'use client'
import { Separator } from '@/components/ui/separator'
import UserStats from './components/UserStats'
import UserTable from './components/UsersTable'

export const dynamic = 'force-dynamic'
export default function UserPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Manajemen Pengguna</h1>
        <p className="text-muted-foreground mt-1">Kelola pengguna sistem — Admin, Kasir, dan Gudang.</p>
      </header>

      <UserStats />

      <Separator />

      <section>
        <h2 className="text-lg font-semibold mb-4">Daftar Pengguna</h2>
        <UserTable />
      </section>
    </div>
  )
}