//app/dashboard/users/components/UserStats.jsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useUsers from '@/hooks/useUsers'
import { Clock, UserCheck, Users } from 'lucide-react'
import { useMemo } from 'react'

export default function UserStats() {
  const { users, loading } = useUsers()

  const stats = useMemo(() => {
    if (!users?.length) return []

    const total = users.length
    const approved = users.filter(u => u.is_approved).length
    const pending = users.filter(u => !u.is_approved).length

    const roleCount = users.reduce((acc, user) => {
      const role = user.roles?.name || 'Tanpa Role'
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {})

    return [
      { label: 'Total Pengguna', value: total, icon: Users },
      { label: 'Disetujui', value: approved, icon: UserCheck },
      { label: 'Menunggu Persetujuan', value: pending, icon: Clock },
      ...Object.entries(roleCount).map(([role, count]) => ({
        label: `Role: ${role}`,
        value: count,
        icon: Users,
      })),
    ]
  }, [users])

  if (loading) {
    return <p className="text-center text-gray-400 py-6">Memuat statistik...</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">{s.label}</CardTitle>
            <s.icon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
