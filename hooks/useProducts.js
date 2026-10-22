// hooks/useProducts.js
"use client";
import { createClient } from '@/utils/supabase/client'; // ✅ Ubah ini
import { useCallback, useEffect, useRef, useState } from "react";

export default function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)
  const supabase = createClient() // ✅ Tambah ini

  const fetchProducts = useCallback(async () => {
    if (!supabase) { // ✅ Guard clause
      setError('Supabase client not available')
      setLoading(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from("products")
        .select("id, code, color, size, category")
        .order("created_at", { ascending: false })
        .abortSignal(abortControllerRef.current.signal)

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted')
        return
      }
      setError(err.message)
      console.error("Fetch products error:", err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase]) // ✅ Tambah dependency

  const addProduct = useCallback(async (newProduct) => {
    if (!supabase) return { success: false, error: 'Supabase client not available' }
    
    try {
      const { error } = await supabase.from("products").insert([newProduct])
      if (error) throw error
      await fetchProducts()
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [supabase, fetchProducts])

  const deleteProduct = useCallback(async (id) => {
    if (!supabase) return { success: false, error: 'Supabase client not available' }
    
    try {
      const { error } = await supabase.from("products").delete().eq("id", id)
      if (error) throw error
      setProducts((prev) => prev.filter((p) => p.id !== id))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [supabase])

  const updateProduct = useCallback(async (id, updatedData) => {
    if (!supabase) return { success: false, error: 'Supabase client not available' }
    
    try {
      const { error } = await supabase.from("products").update(updatedData).eq("id", id)
      if (error) throw error
      await fetchProducts()
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [supabase, fetchProducts])

  useEffect(() => {
    fetchProducts()
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchProducts])

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    deleteProduct,
    updateProduct,
  }
}