'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

// Get singleton client instance outside component to prevent re-renders
const supabase = createClient();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_name, user_phoneno, role, is_approved, tier, points_balance, created_at')
          .eq('id', userId)
          .single();
        
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
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
      }
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
  const isKasir = profile?.role === 'kasir';
  const isUser = profile?.role === 'normal_user';

  const refetchProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_name, user_phoneno, role, is_approved, tier, points_balance, created_at')
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
    isUser,
    refetchProfile,
  };
}
