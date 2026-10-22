//app/dashboard/users/components/UsersTable.jsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import useUsers from '@/hooks/useUsers'
import { CheckCircle, Loader2, Trash2 } from '@/lib/icons'

export default function UserTable() {
  const { users, loading, error, updateUser, deleteUser } = useUsers()

  // ✅ Approve user
  const handleApprove = async (user) => {
    try {
      await updateUser(user.id, { is_approved: true })
      alert(`User ${user.full_name || user.email} telah disetujui ✅`)
    } catch (err) {
      alert(`Gagal menyetujui user: ${err.message}`)
    }
  }

  // ✅ Hapus user
  const handleDelete = async (user) => {
    if (confirm(`Yakin ingin menghapus ${user.full_name || user.email}?`)) {
      try {
        await deleteUser(user.id)
      } catch (err) {
        alert(`Gagal menghapus user: ${err.message}`)
      }
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
      </div>
    )

  if (error)
    return <p className="text-red-500 text-center mt-4">Gagal memuat data: {error}</p>

  if (!users?.length)
    return <p className="text-center text-gray-400 py-10">Belum ada data pengguna.</p>

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="text-gray-600 font-medium">Email</TableHead>
            <TableHead className="text-gray-600 font-medium">Nama Lengkap</TableHead>
            <TableHead className="text-gray-600 font-medium">Role</TableHead>
            <TableHead className="text-gray-600 font-medium">Status</TableHead>
            <TableHead className="text-right text-gray-600 font-medium">Aksi</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-gray-50">
              <TableCell className="text-gray-700">{user.email}</TableCell>
              <TableCell className="text-gray-900 font-medium">{user.full_name || '-'}</TableCell>
              <TableCell className="text-gray-600">{user.roles?.name || 'Belum ada peran'}</TableCell>
              <TableCell>
                {user.is_approved ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Disetujui
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-700 border-0 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Pending
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {!user.is_approved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApprove(user)}
                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(user)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Hapus
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
