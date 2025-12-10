'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

// Get singleton client instance outside component to prevent re-renders
const supabase = createClient();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Create a timeout function for async operations
    const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
        ) as Promise<T>
      ]);
    };

    const fetchProfile = async (userId: string) => {
      try {
        // Add timeout to prevent hanging on profile fetch
        const { data, error } = await withTimeout(
          supabase
            .from('profiles')
            .select('id, user_name, user_phoneno, role, is_approved, tier, points_balance, referral_code, created_at')
            .eq('id', userId)
            .single(),
          5000 // 5 second timeout
        );

        if (error) {
          console.error('Error fetching profile:', error.message || error);
          setProfile(null);
          return;
        }

        setProfile(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Exception fetching profile:', errorMessage);
        setProfile(null);
      }
    };

    const getUser = async () => {
      try {
        // Add timeout to prevent hanging - use getSession first (faster, from cache)
        // then getUser will be called by onAuthStateChange if needed
        const getSessionPromise = supabase.auth.getSession();
        const { data: { session }, error: sessionError } = await withTimeout(getSessionPromise, 5000);

        if (sessionError) {
          console.error('Error getting session:', sessionError.message);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      } catch (error) {
        console.error('Exception getting user:', error);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    getUser();

    // Listen to auth state changes including TOKEN_REFRESHED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // Handle different auth events
        if (event === 'TOKEN_REFRESHED') {
          // Token was refreshed successfully, update user state
          if (session?.user) {
            setUser(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        } else if (event === 'INITIAL_SESSION') {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
        setLoading(false);
      }
    );

    // Periodically check and refresh session to prevent expiry during long browsing
    // This runs every 2 minutes to keep the session alive
    sessionCheckInterval.current = setInterval(async () => {
      try {
        const getSessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await withTimeout(getSessionPromise, 5000);

        if (error || !session) {
          return;
        }

        // Check if token expires within 5 minutes
        const expiresAt = session.expires_at;
        if (expiresAt) {
          const expiresIn = expiresAt * 1000 - Date.now();
          // If token expires in less than 5 minutes, refresh it
          if (expiresIn < 5 * 60 * 1000) {
            const refreshPromise = supabase.auth.refreshSession();
            const { error: refreshError } = await withTimeout(refreshPromise, 5000);
            if (refreshError) {
              console.error('Failed to refresh session:', refreshError.message);
            }
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => {
      subscription.unsubscribe();
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, []);

  const signInWithPhoneOtp = async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { data, error };
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { data, error };
  };

  const signInWithPhone = async (phone: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    });
    return { data, error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUpWithEmail = async (
    email: string, 
    password: string, 
    metadata?: { full_name?: string; phone?: string }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  };

  const signOut = useCallback(async () => {
    try {
      // Clear local state first
      setLoading(true);
      setUser(null);
      setProfile(null);
      
      // Call server-side signout to clear cookies first
      try {
        await fetch('/api/auth/signout', { 
          method: 'POST',
          credentials: 'include'
        });
      } catch (e) {
        console.warn('Server signout failed, continuing with client signout:', e);
      }
      
      // Sign out on client side
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Supabase signOut error:', error);
      }
      
      setLoading(false);
      
      return { error: null };
    } catch (err) {
      console.error('Sign out error:', err);
      // Still clear local state on error to prevent stuck state
      setUser(null);
      setProfile(null);
      setLoading(false);
      return { error: err as Error };
    }
  }, []);

  const isAdmin = profile?.role === 'master_admin' || profile?.role === 'normal_admin';
  const isMasterAdmin = profile?.role === 'master_admin';
  const isKasir = profile?.role === 'kasir' || profile?.role === 'super_user';
  const isSuperUser = profile?.role === 'super_user';
  const isUser = profile?.role === 'normal_user' || profile?.role === 'super_user';

  const refetchProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_name, user_phoneno, role, is_approved, tier, points_balance, referral_code, created_at')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error refetching profile:', error.message || error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Exception refetching profile:', errorMessage);
    }
  }, [user]);

  return {
    user,
    profile,
    loading,
    signInWithPhone,
    signInWithPhoneOtp,
    verifyOtp,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isAdmin,
    isMasterAdmin,
    isKasir,
    isSuperUser,
    isUser,
    refetchProfile,
  };
}
