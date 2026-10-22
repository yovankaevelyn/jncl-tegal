// hooks/useUsers.js
'use client'
import { createClient } from '@/utils/supabase/client'; // ✅ Ubah ini
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const abortControllerRef = useRef(null)
  const isMounted = useRef(true)
  const supabase = createClient() // ✅ Tambah ini

  const fetchUsers = useCallback(async () => {
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
        .from('user_profiles')
        .select(`
          id,
          email,
          full_name,
          is_approved,
          created_at,
          roles(name)
        `)
        .order('created_at', { ascending: false })
        .abortSignal(abortControllerRef.current.signal)

      if (error) throw error
      
      if (isMounted.current) {
        setUsers(data || [])
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch users aborted')
        return
      }
      console.error(err)
      if (isMounted.current) {
        setError(err.message)
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [supabase]) // ✅ Tambah dependency

  const updateUser = useCallback(async (id, updates) => {
    if (!supabase) return { success: false, error: 'Supabase client not available' }
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (isMounted.current) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, ...data } : u))
        )
      }

      return { success: true, data }
    } catch (err) {
      console.error(err)
      return { success: false, error: err.message }
    }
  }, [supabase])

  const deleteUser = useCallback(async (id) => {
    if (!supabase) return { success: false, error: 'Supabase client not available' }
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id)

      if (error) throw error

      if (isMounted.current) {
        setUsers((prev) => prev.filter((u) => u.id !== id))
      }
      
      return { success: true }
    } catch (err) {
      console.error(err)
      return { success: false, error: err.message }
    }
  }, [supabase])

  useEffect(() => {
    fetchUsers()
    
    return () => {
      isMounted.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchUsers])

  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUser,
    deleteUser,
  }
}