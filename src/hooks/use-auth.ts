'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

// Get singleton client instance outside component to prevent re-renders
const supabase = createClient();

// Create a Zustand store to make the auth state accessible globally
import { create } from 'zustand';

interface AuthStore {
  user: any;
  profile: any;
  loading: boolean;
  role: string | null;
}

const useAuthStore = create<AuthStore>(() => ({
  user: null,
  profile: null,
  loading: true,
  role: null
}));

export function useAuth() {
  // Track idle timeout state
  const [idleTimeoutActive, setIdleTimeoutActive] = useState(true);

  // Create a timeout function for async operations
  const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      ) as Promise<T>
    ]);
  };

  // Specialized timeout function for Supabase operations that preserves type
  const withTimeoutSupabase = useCallback(async <T>(
    promise: Promise<{ data: T | null; error: any }>,
    timeoutMs: number
  ): Promise<{ data: T | null; error: any }> => {
    try {
      const withTimeoutInner = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
          ) as Promise<T>
        ]);
      };

      return await withTimeoutInner(promise, timeoutMs);
    } catch (error) {
      return { data: null, error: error as any };
    }
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Define a local timeout function for use in this effect
    const withTimeoutEffect = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
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
        // Include all profile fields including province fields needed for the UI
        const { data, error } = await withTimeoutSupabase<Profile>(
          supabase
            .from('profiles')
            .select(`
              id,
              user_name,
              user_phoneno,
              user_email,
              role,
              is_approved,
              tier,
              points_balance,
              referral_code,
              created_at,
              address_line1,
              city,
              province_id,
              postal_code,
              recipient_name,
              recipient_address_line1,
              recipient_city,
              recipient_province_id,
              recipient_postal_code,
              recipient_phoneno
            `)
            .eq('id', userId)
            .single() as Promise<{ data: Profile | null; error: any }>,
          15000 // 15 second timeout - increasing to prevent timeout error
        );

        if (error) {
          console.error('Error fetching profile:', error.message || error);
          setProfile(null);
          useAuthStore.setState({ profile: null, role: null });
          return;
        }

        setProfile(data);

        // Update the global store
        useAuthStore.setState({ profile: data, role: data?.role || null });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Exception fetching profile:', errorMessage);
        setProfile(null);
        useAuthStore.setState({ profile: null, role: null });
      }
    };

    const getUser = async () => {
      try {
        // Add timeout to prevent hanging - use getSession first (faster, from cache)
        // then getUser will be called by onAuthStateChange if needed
        const getSessionPromise = supabase.auth.getSession();
        type SessionResult = {
          data: { session: Session | null },
          error: any
        };

        const sessionResult = await withTimeoutEffect(
          getSessionPromise,
          15000  // Increase this from 10000 to 15000 to prevent timeout error
        ) as SessionResult;

        const { data: { session }, error: sessionError } = sessionResult;

        if (sessionError) {
          console.error('Error getting session:', sessionError.message);
          setUser(null);
          setProfile(null);
          useAuthStore.setState({ user: null, profile: null, role: null });
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          useAuthStore.setState({ user: session.user });
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          useAuthStore.setState({ user: null, profile: null, role: null });
        }
        setLoading(false);
      } catch (error) {
        console.error('Exception getting user:', error);
        setUser(null);
        setProfile(null);
        useAuthStore.setState({ user: null, profile: null, role: null });
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
            useAuthStore.setState({ user: session.user });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          useAuthStore.setState({ user: null, profile: null, role: null });
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setUser(session?.user ?? null);
          useAuthStore.setState({ user: session?.user ?? null });
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
            useAuthStore.setState({ profile: null, role: null });
          }
        } else if (event === 'INITIAL_SESSION') {
          setUser(session?.user ?? null);
          useAuthStore.setState({ user: session?.user ?? null });
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
        setLoading(false);
      }
    );

    // Function to check and refresh session to prevent expiry during long browsing
    const checkAndRefreshSession = async () => {
      try {
        const getSessionPromise = supabase.auth.getSession();
        type SessionResult = {
          data: { session: Session | null },
          error: any
        };

        const sessionResult = await withTimeoutEffect(
          getSessionPromise,
          15000  // Increase to 15000 to prevent timeout error
        ) as SessionResult;

        const { data: { session }, error } = sessionResult;

        if (error || !session) {
          // If session retrieval fails, user might be logged out, so sign out properly
          await signOut();
          return;
        }

        // Check if token expires within 5 minutes
        const expiresAt = session.expires_at;
        if (expiresAt) {
          const expiresIn = expiresAt * 1000 - Date.now();
          // If token expires in less than 5 minutes, refresh it
          if (expiresIn < 5 * 60 * 1000) {
            const refreshPromise = supabase.auth.refreshSession();
            type RefreshResult = {
              data: { session: Session | null },
              error: any
            };

            const refreshResult = await withTimeoutEffect(
              refreshPromise,
              15000  // Increase to 15000 to prevent timeout error
            ) as RefreshResult;

            const { error: refreshError, data: refreshData } = refreshResult;
            if (refreshError) {
              console.error('Failed to refresh session:', refreshError.message);
              // If refresh fails, force logout as session may be invalid
              await signOut();
            } else if (refreshData.session) {
              // Update session in the UI after refresh
              setUser(refreshData.session.user);
              useAuthStore.setState({ user: refreshData.session.user });
            }
          } else if (expiresIn < 0) {
            // If already expired, sign out
            await signOut();
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
        // If the check completely fails, sign out the user as session may be invalid
        await signOut();
      }
    };

    // Periodically check and refresh session to prevent expiry during long browsing
    // This runs every 2 minutes to keep the session alive
    sessionCheckInterval.current = setInterval(checkAndRefreshSession, 2 * 60 * 1000); // Every 2 minutes

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
      useAuthStore.setState({ user: null, profile: null, role: null });

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
      useAuthStore.setState({ user: null, profile: null, role: null });
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

    // Create a timeout function for async operations within this callback
    const withTimeoutInner = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
        ) as Promise<T>
      ]);
    };

    // Specialized timeout function for Supabase operations that preserves type
    const withTimeoutSupabaseInner = async <T>(
      promise: Promise<{ data: T | null; error: any }>,
      timeoutMs: number
    ): Promise<{ data: T | null; error: any }> => {
      try {
        return await withTimeoutInner(promise, timeoutMs);
      } catch (error) {
        return { data: null, error: error as any };
      }
    };

    try {
      const { data, error } = await withTimeoutSupabaseInner<Profile>(
        supabase
          .from('profiles')
          .select(`
            id,
            user_name,
            user_phoneno,
            user_email,
            user_avatar_url,
            role,
            is_approved,
            tier,
            points_balance,
            referral_code,
            created_at,
            address_line1,
            city,
            province_id,
            postal_code,
            recipient_name,
            recipient_address_line1,
            recipient_city,
            recipient_province_id,
            recipient_postal_code,
            recipient_phoneno,
            level,
            unlocked_breeds
          `)
          .eq('id', user.id)
          .single() as Promise<{ data: Profile | null; error: any }>,
        15000 // 15 second timeout - increasing to prevent timeout error
      );

      if (error) {
        console.error('Error refetching profile:', error.message || error);
        return;
      }

      setProfile(data);
      useAuthStore.setState({ profile: data, role: data?.role });
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
    setIdleTimeoutActive,
    idleTimeoutActive,
  };
}

// Export the auth store state to be accessible globally
export const useAuthState = () => {
  return {
    user: useAuthStore.getState().user,
    profile: useAuthStore.getState().profile,
    role: useAuthStore.getState().role,
  };
};
