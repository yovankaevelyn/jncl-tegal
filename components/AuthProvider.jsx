'use client';

import { createClient } from '@/utils/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const pathname = usePathname();
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const supabaseRef = useRef(null);
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }, []);

  const router           = useRouter();
  const isMounted        = useRef(true);
  const fetchingProfile  = useRef(false);
  const initialLoadDone  = useRef(false);

  // ─────────────────────────────────────────────
  // Helper: ambil profile dari DB (dengan timeout)
  // ─────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId) => {
    if (!userId || fetchingProfile.current) return null;

    const supabase = getSupabase();
    if (!supabase) return null;

    fetchingProfile.current = true;
    console.log('👤 Fetching profile for:', userId);

    try {
      const { data, error } = await Promise.race([
        supabase
          .from('user_profiles')
          .select('*, roles (id, name)')
          .eq('id', userId)
          .single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile timeout')), 5000)
        ),
      ]);

      if (error) throw error;
      if (!isMounted.current) return null;

      const profileWithRole = { ...data, role: data.roles?.name || null };
      console.log('✅ Profile loaded:', profileWithRole.role);
      return profileWithRole;
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      return null;
    } finally {
      fetchingProfile.current = false;
    }
  }, [getSupabase]);

  // ─────────────────────────────────────────────
  // Inisialisasi auth — PARALEL session + profile
  // ─────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    if (initialLoadDone.current) {
      console.log('⏭️ Initial load already done');
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      setIsReady(true);
      return;
    }

    console.log('🔍 Initializing auth (parallel)...');

    const initAuth = async () => {
      try {
        // ⚡ Langkah 1: getSession dengan timeout pendek
        const { data: { session }, error: sessionError } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Session timeout')), 8000)
          ),
        ]);

        if (sessionError) throw sessionError;
        if (!isMounted.current) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          console.log('✅ Session found:', currentUser.email);
          // ⚡ Langkah 2: fetch profile (sudah dengan timeout 5s di dalam fetchProfile)
          const profileData = await fetchProfile(currentUser.id);
          if (isMounted.current) {
            setProfile(profileData);
          }
        } else {
          console.log('ℹ️ No active session');
        }

        initialLoadDone.current = true;
      } catch (err) {
        console.error('❌ Auth init error:', err);
        if (isMounted.current) {
          setUser(null);
          setProfile(null);
        }
        initialLoadDone.current = true;
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setIsReady(true);
        }
      }
    };

    initAuth();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth event:', event);
        if (!isMounted.current) return;

        // Skip INITIAL_SESSION — sudah ditangani oleh initAuth
        if (event === 'INITIAL_SESSION') return;

        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ SIGNED_IN event');
            setUser(session?.user ?? null);
            if (session?.user && !fetchingProfile.current) {
              const p = await fetchProfile(session.user.id);
              if (isMounted.current) setProfile(p);
            }
            break;

          case 'SIGNED_OUT':
            setUser(null);
            setProfile(null);
            fetchingProfile.current  = false;
            initialLoadDone.current  = false;
            break;

          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            setUser(session?.user ?? null);
            break;

          case 'USER_UPDATED':
            setUser(session?.user ?? null);
            if (session?.user && !fetchingProfile.current) {
              const p = await fetchProfile(session.user.id);
              if (isMounted.current) setProfile(p);
            }
            break;

          default:
            break;
        }
      }
    );

    return () => {
      isMounted.current       = false;
      fetchingProfile.current = false;
      subscription.unsubscribe();
      console.log('🔌 Auth cleanup');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);   // ← run ONCE only; fetchProfile & getSupabase are stable refs

  // ─────────────────────────────────────────────
  // Sign In
  // ─────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    try {
      console.log('🔐 Signing in...');

      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Sign in timeout')), 10000)
        ),
      ]);

      if (error) throw error;

      // Fetch profile setelah sign in
      const { data: userProfile, error: profileError } = await Promise.race([
        supabase
          .from('user_profiles')
          .select('*, roles (id, name)')
          .eq('id', data.user.id)
          .single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile timeout')), 5000)
        ),
      ]);

      if (profileError) throw profileError;

      if (!userProfile.is_approved) {
        await supabase.auth.signOut();
        router.push('/auth/pending-approval');
        throw new Error('Account not approved');
      }

      const profileWithRole = { ...userProfile, role: userProfile.roles?.name || null };
      setUser(data.user);
      setProfile(profileWithRole);
      setIsReady(true);
      setLoading(false);

      console.log('✅ Sign in successful');
      return data;
    } catch (err) {
      console.error('❌ Sign in error:', err);
      throw err;
    }
  }, [getSupabase, router]);

  // ─────────────────────────────────────────────
  // Sign Up
  // ─────────────────────────────────────────────
  const signUp = useCallback(async (email, password, fullName) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('❌ Sign up error:', err);
      throw err;
    }
  }, [getSupabase]);

  // ─────────────────────────────────────────────
  // Sign Out
  // ─────────────────────────────────────────────
  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    try {
      console.log('🚪 Signing out...');
      setLoading(true);

      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Sign out timeout')), 3000)
        ),
      ]);
    } catch (err) {
      console.error('❌ Sign out error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setIsReady(true);
      setLoading(false);
      fetchingProfile.current  = false;
      initialLoadDone.current  = false;
      router.push('/auth/signin');
    }
  }, [getSupabase, router]);

  // ─────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────
  const value = {
    user,
    profile,
    loading,
    isLoading : loading,
    isReady,
    isApproved: profile?.is_approved ?? false,
    userRole  : profile?.role || null,
    // Shorthand helpers
    userProfile: profile,
    isKasir : profile?.role === 'Kasir',
    isGudang : profile?.role === 'Gudang',
    isAdmin  : profile?.role === 'Admin',
    supabase : getSupabase(),
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
