//app/dashboard/users/components/UsersTable.jsx
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, Loader2, Trash2 } from '@/lib/icons'
import { useState } from 'react'

// ✅ FIX #5: Terima users, loading, error, updateUser, deleteUser dari props
export default function UserTable({ users = [], loading = false, error = null, updateUser, deleteUser }) {
  const { toast } = useToast()

  // ✅ FIX #3: State untuk AlertDialog, menggantikan alert()/confirm()
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })
  const [isProcessing, setIsProcessing] = useState(false)

  // ✅ Approve user — menggunakan toast, bukan alert()
  const handleApprove = async (user) => {
    try {
      setIsProcessing(true)
      await updateUser(user.id, { is_approved: true })
      toast({
        title: 'Berhasil',
        description: `User ${user.full_name || user.email} telah disetujui ✅`,
      })
    } catch (err) {
      toast({
        title: 'Gagal menyetujui user',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // ✅ Hapus user — menggunakan AlertDialog, bukan confirm()
  const handleDeleteConfirm = async () => {
    const user = deleteDialog.user
    if (!user) return

    try {
      setIsProcessing(true)
      await deleteUser(user.id)
      toast({
        title: 'User dihapus',
        description: `${user.full_name || user.email} telah dihapus dari sistem.`,
      })
    } catch (err) {
      toast({
        title: 'Gagal menghapus user',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
      setDeleteDialog({ open: false, user: null })
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
    <>
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
                      disabled={isProcessing}
                      className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteDialog({ open: true, user })}
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

      {/* ✅ FIX #3: AlertDialog menggantikan confirm() */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, user: null })
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus{' '}
              <span className="font-semibold text-gray-900">
                {deleteDialog.user?.full_name || deleteDialog.user?.email}
              </span>
              ? Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Ya, Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
