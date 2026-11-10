// lib/validations.js
// ✅ FIX #7: Zod schemas untuk validasi input data
import { z } from 'zod'

// Schema untuk Product
export const productSchema = z.object({
  code: z
    .string()
    .min(1, 'Kode barang wajib diisi')
    .max(50, 'Kode barang maksimal 50 karakter')
    .trim(),
  color: z
    .string()
    .min(1, 'Warna wajib diisi')
    .max(50, 'Warna maksimal 50 karakter')
    .trim(),
  size: z
    .string()
    .min(1, 'Ukuran wajib diisi')
    .max(20, 'Ukuran maksimal 20 karakter')
    .trim(),
  category: z
    .string()
    .max(100, 'Kategori maksimal 100 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
})

// Schema untuk Request Item (dalam keranjang)
export const requestItemSchema = z.object({
  code: z
    .string()
    .min(1, 'Kode produk wajib diisi'),
  color: z
    .string()
    .optional()
    .default('-'),
  size: z
    .string()
    .optional()
    .default('-'),
  quantity: z
    .number({ invalid_type_error: 'Jumlah harus berupa angka' })
    .int('Jumlah harus bilangan bulat')
    .min(1, 'Jumlah minimal 1')
    .max(9999, 'Jumlah maksimal 9999'),
})

// Schema untuk membuat Request (seluruh keranjang)
export const createRequestSchema = z.object({
  message: z
    .string()
    .max(500, 'Pesan maksimal 500 karakter')
    .trim()
    .optional()
    .or(z.literal(''))
    .or(z.null()),
  items: z
    .array(requestItemSchema)
    .min(1, 'Keranjang tidak boleh kosong'),
})

// Schema untuk update user
export const updateUserSchema = z.object({
  is_approved: z.boolean().optional(),
  full_name: z
    .string()
    .min(1, 'Nama lengkap wajib diisi')
    .max(100, 'Nama maksimal 100 karakter')
    .trim()
    .optional(),
})

// Helper: validate data, return { success, data, error }
export function validate(schema, data) {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data, error: null }
  }
  // Ambil pesan error pertama
  const firstError = result.error.errors[0]
  return {
    success: false,
    data: null,
    error: firstError?.message || 'Data tidak valid',
  }
}
