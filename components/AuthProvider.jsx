'use client';

import { createClient } from '@/utils/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const AuthContext = createContext({});

// ✅ Pages yang TIDAK butuh auth check realtime
const PUBLIC_PATHS = ['/dashboard/history'];

export const AuthProvider = ({ children }) => {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  const supabaseRef = useRef(null);
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);
  
  const router = useRouter();
  const isMounted = useRef(true);
  const fetchingProfile = useRef(false);
  const initialLoadDone = useRef(false); // ✅ BARU: Track initial load

  // ✅ Skip auth for public paths
  const shouldSkipAuth = PUBLIC_PATHS.includes(pathname);

  // Fetch profile with lock
  const fetchProfile = useCallback(async (userId) => {
    if (!userId || fetchingProfile.current || shouldSkipAuth) {
      return;
    }
    
    const supabase = getSupabase();
    if (!supabase) return;
    
    fetchingProfile.current = true;
    console.log('👤 Fetching profile for:', userId);
    
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile timeout')), 5000)
      );

      const fetchPromise = supabase
        .from('user_profiles')
        .select(`*, roles (id, name)`)
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) throw error;
      
      if (!isMounted.current) return;

      const profileWithRole = {
        ...data,
        role: data.roles?.name || null,
      };
      
      console.log('✅ Profile loaded:', profileWithRole.role);
      setProfile(profileWithRole);
      setIsReady(true);
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      if (isMounted.current) {
        setProfile(null);
        setIsReady(true);
      }
    } finally {
      fetchingProfile.current = false;
    }
  }, [getSupabase, shouldSkipAuth]);

  // Initialize auth ONCE
  useEffect(() => {
    isMounted.current = true;

    // ✅ Skip initialization for public paths
    if (shouldSkipAuth) {
      console.log('⏭️ Skipping auth for public path:', pathname);
      setLoading(false);
      setIsReady(true);
      return;
    }

    // ✅ CRITICAL FIX: Only run initial load once
    if (initialLoadDone.current) {
      console.log('⏭️ Initial load already done');
      return;
    }

    console.log('🔍 Initializing auth...');
    const supabase = getSupabase();
    
    if (!supabase) {
      setLoading(false);
      setIsReady(true);
      return;
    }
    
    const initAuth = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);

        if (error) throw error;
        
        if (!isMounted.current) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (session?.user) {
          console.log('✅ Session found:', session.user.email);
          await fetchProfile(session.user.id);
        } else {
          console.log('ℹ️ No active session');
          setIsReady(true);
        }

        initialLoadDone.current = true; // ✅ Mark as done
      } catch (error) {
        console.error('❌ Auth init error:', error);
        if (isMounted.current) {
          setUser(null);
          setProfile(null);
          setIsReady(true);
        }
        initialLoadDone.current = true;
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth event:', event);
        
        if (!isMounted.current) return;

        // ✅ FIXED: Don't skip SIGNED_IN on initial load
        if (event === 'INITIAL_SESSION') {
          console.log('⏭️ Skip INITIAL_SESSION (handled by initAuth)');
          return;
        }

        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ SIGNED_IN event - updating user');
            setUser(session?.user ?? null);
            if (session?.user && !fetchingProfile.current) {
              await fetchProfile(session.user.id);
            }
            break;
            
          case 'SIGNED_OUT':
            setUser(null);
            setProfile(null);
            setIsReady(true);
            fetchingProfile.current = false;
            initialLoadDone.current = false; // ✅ Reset on sign out
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            setUser(session?.user ?? null);
            break;

          case 'USER_UPDATED':
            setUser(session?.user ?? null);
            if (session?.user && !fetchingProfile.current) {
              await fetchProfile(session.user.id);
            }
            break;
            
          default:
            break;
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
      fetchingProfile.current = false;
      console.log('🔌 Auth cleanup');
    };
  }, [getSupabase, fetchProfile, shouldSkipAuth, pathname]);

  // Sign In
  const signIn = useCallback(async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    try {
      console.log('🔐 Signing in...');
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign in timeout')), 10000)
      );

      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const { data, error } = await Promise.race([signInPromise, timeoutPromise]);

      if (error) throw error;

      const profilePromise = supabase
        .from('user_profiles')
        .select(`*, roles (id, name)`)
        .eq('id', data.user.id)
        .single();

      const { data: userProfile, error: profileError } = await Promise.race([
        profilePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Profile timeout')), 5000))
      ]);

      if (profileError) throw profileError;

      if (!userProfile.is_approved) {
        await supabase.auth.signOut();
        router.push('/auth/pending-approval');
        throw new Error('Account not approved');
      }

      // ✅ CRITICAL: Set user and profile immediately
      setUser(data.user);
      setProfile({
        ...userProfile,
        role: userProfile.roles?.name || null
      });
      setIsReady(true);
      setLoading(false);

      console.log('✅ Sign in successful');
      return data;
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  }, [getSupabase, router]);

  // Sign Up
  const signUp = useCallback(async (email, password, fullName) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
  }, [getSupabase]);

  // Sign Out
  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    try {
      console.log('🚪 Signing out...');
      setLoading(true);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timeout')), 3000)
      );

      const signOutPromise = supabase.auth.signOut();
      await Promise.race([signOutPromise, timeoutPromise]);

      setUser(null);
      setProfile(null);
      setIsReady(true);
      fetchingProfile.current = false;
      initialLoadDone.current = false; // ✅ Reset
      
      console.log('✅ Signed out');
      router.push('/auth/signin');
      router.refresh();
    } catch (error) {
      console.error('❌ Sign out error:', error);
      
      setUser(null);
      setProfile(null);
      setIsReady(true);
      fetchingProfile.current = false;
      initialLoadDone.current = false;
      
      router.push('/auth/signin');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }, [getSupabase, router]);

  const value = {
    user,
    profile,
    loading,
    isLoading: loading,
    isReady,
    userRole: profile?.role || null,
    supabase: getSupabase(),
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
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};