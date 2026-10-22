//app/dashboard/products/components/ProductForm.jsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from '@/lib/icons'
import { useState } from 'react'

export default function ProductForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    code: '',
    color: '',
    size: '',
    category: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      setFormData({ code: '', color: '', size: '', category: '' })
    } catch (err) {
      console.error('Gagal menambahkan produk:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Kode Barang */}
      <div>
        <Label htmlFor="code" className="text-sm font-medium text-gray-700">
          Kode Barang
        </Label>
        <Input
          id="code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder="Misal: PRD-001"
          required
          className="mt-1 text-gray-900 placeholder:text-gray-400 bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
        />
      </div>

      {/* Warna */}
      <div>
        <Label htmlFor="color" className="text-sm font-medium text-gray-700">
          Warna
        </Label>
        <Input
          id="color"
          name="color"
          value={formData.color}
          onChange={handleChange}
          placeholder="Misal: Merah"
          required
          className="mt-1 text-gray-900 placeholder:text-gray-400 bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
        />
      </div>

      {/* Ukuran */}
      <div>
        <Label htmlFor="size" className="text-sm font-medium text-gray-700">
          Ukuran
        </Label>
        <Input
          id="size"
          name="size"
          value={formData.size}
          onChange={handleChange}
          placeholder="Misal: L / M / S / XL"
          required
          className="mt-1 text-gray-900 placeholder:text-gray-400 bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
        />
      </div>

      {/* Kategori */}
      <div>
        <Label htmlFor="category" className="text-sm font-medium text-gray-700">
          Kategori
        </Label>
        <Input
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="Misal: Kaos, Kemeja, Celana"
          className="mt-1 text-gray-900 placeholder:text-gray-400 bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
        />
      </div>

      {/* Tombol */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="border-gray-300 text-gray-700 hover:bg-gray-50">
          Batal
        </Button>
        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Simpan Produk'
          )}
        </Button>
      </div>
    </form>
  )
}
