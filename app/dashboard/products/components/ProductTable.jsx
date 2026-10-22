//app/dashboard/products/components/ProductTable.jsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Pencil, Save, Trash2, X } from '@/lib/icons'
import { useState } from 'react'

export default function ProductTable({ products, onDelete, onUpdate }) {
  const { toast } = useToast()
  const [editingId, setEditingId] = useState(null)
  const [editedData, setEditedData] = useState({})

  const startEditing = (product) => {
    setEditingId(product.id)
    setEditedData(product)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditedData({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setEditedData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      await onUpdate(editingId, editedData)
      toast({
        title: 'Berhasil',
        description: 'Produk berhasil diperbarui.',
      })
      setEditingId(null)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Gagal',
        description: 'Tidak dapat memperbarui produk.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus produk ini?')) {
      try {
        await onDelete(id)
        toast({
          title: 'Produk dihapus',
          description: 'Data produk telah dihapus dari database.',
        })
      } catch (error) {
        console.error(error)
        toast({
          title: 'Gagal menghapus',
          description: 'Terjadi kesalahan saat menghapus produk.',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
      <CardHeader className="border-b border-gray-200 bg-white">
        <CardTitle className="text-base font-semibold text-gray-900">Daftar Produk</CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-[20%] text-gray-600 font-medium">Kode Barang</TableHead>
                <TableHead className="w-[20%] text-gray-600 font-medium">Warna</TableHead>
                <TableHead className="w-[15%] text-gray-600 font-medium">Ukuran</TableHead>
                <TableHead className="w-[25%] text-gray-600 font-medium">Kategori</TableHead>
                <TableHead className="text-right w-[20%] text-gray-600 font-medium">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    Belum ada produk.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell>
                      {editingId === product.id ? (
                        <Input
                          name="code"
                          value={editedData.code}
                          onChange={handleChange}
                          className="h-8 border-gray-300"
                        />
                      ) : (
                        <span className="font-mono font-medium text-gray-900">{product.code}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === product.id ? (
                        <Input
                          name="color"
                          value={editedData.color}
                          onChange={handleChange}
                          className="h-8 border-gray-300"
                        />
                      ) : (
                        <span className="text-gray-700">{product.color}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === product.id ? (
                        <Input
                          name="size"
                          value={editedData.size}
                          onChange={handleChange}
                          className="h-8 border-gray-300"
                        />
                      ) : (
                        <span className="text-gray-700">{product.size}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === product.id ? (
                        <Input
                          name="category"
                          value={editedData.category}
                          onChange={handleChange}
                          className="h-8 border-gray-300"
                        />
                      ) : (
                        <span className="text-gray-700">{product.category || '-'}</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {editingId === product.id ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            <Save size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            className="border-gray-300 text-gray-600 hover:bg-gray-50"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(product)}
                            className="border-gray-300 text-gray-600 hover:bg-gray-50"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(product.id)}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
