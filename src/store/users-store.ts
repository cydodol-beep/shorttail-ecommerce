import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  user_phoneno?: string;
  user_name?: string;
  user_email?: string;
  user_avatar_url?: string;
  role: string;
  tier: string;
  points_balance: number;
  referral_code?: string;
  referred_by?: string;
  address_line1?: string;
  city?: string;
  region_state_province?: string;
  province_id?: number;
  postal_code?: string;
  country_id?: number;
  recipient_name?: string;
  recipient_phoneno?: string;
  recipient_address_line1?: string;
  recipient_city?: string;
  recipient_region?: string;
  recipient_province_id?: number;
  recipient_postal_code?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  user_name: string;
  user_email: string;
  user_phoneno: string;
  password?: string;
  role: string;
  tier: string;
  points_balance: number;
  address_line1?: string;
  city?: string;
  region_state_province?: string;
  province_id?: string;
  postal_code?: string;
  recipient_name?: string;
  recipient_phoneno?: string;
  recipient_address_line1?: string;
  recipient_city?: string;
  recipient_region?: string;
  recipient_province_id?: string;
  recipient_postal_code?: string;
}

interface UsersStore {
  users: UserProfile[];
  loading: boolean;
  lastFetched: number | null;
  fetchUsers: () => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<boolean>;
  createUser: (userData: UserFormData) => Promise<UserProfile | null>;
  updateUser: (userId: string, userData: UserFormData) => Promise<boolean>;
  approveUser: (userId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  invalidate: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useUsersStore = create<UsersStore>((set, get) => ({
  users: [],
  loading: false,
  lastFetched: null,

  fetchUsers: async () => {
    const state = get();

    // Skip if already loading
    if (state.loading) return;

    // Use cache if valid
    if (state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION) {
      return;
    }

    set({ loading: true });

    try {
      const supabase = createClient();

      console.log('Fetching users from Supabase...');

      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        set({ loading: false });
        return;
      }

      console.log('Users fetch result:', { count: usersData?.length || 0 });

      const users = (usersData || []).map((user: any) => ({
        id: user.id,
        user_phoneno: user.user_phoneno,
        user_name: user.user_name,
        user_email: user.user_email,
        user_avatar_url: user.user_avatar_url,
        role: user.role,
        tier: user.tier,
        points_balance: user.points_balance || 0,
        referral_code: user.referral_code,
        referred_by: user.referred_by,
        address_line1: user.address_line1,
        city: user.city,
        region_state_province: user.region_state_province,
        province_id: user.province_id,
        postal_code: user.postal_code,
        country_id: user.country_id,
        recipient_name: user.recipient_name,
        recipient_phoneno: user.recipient_phoneno,
        recipient_address_line1: user.recipient_address_line1,
        recipient_city: user.recipient_city,
        recipient_region: user.recipient_region,
        recipient_province_id: user.recipient_province_id,
        recipient_postal_code: user.recipient_postal_code,
        is_approved: user.is_approved ?? true,
        created_at: user.created_at,
        updated_at: user.updated_at,
      })) as UserProfile[];

      set({
        users,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error('Exception fetching users:', err);
      set({ loading: false });
    }
  },

  updateUserRole: async (userId: string, role: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('profiles')
        .update({ 
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return false;
      }

      // Update local state
      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId
            ? { ...user, role, updated_at: new Date().toISOString() }
            : user
        ),
      }));

      return true;
    } catch (err) {
      console.error('Exception updating user role:', err);
      return false;
    }
  },

  createUser: async (userData: UserFormData) => {
    try {
      // Use server-side API for user creation (requires admin auth)
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating user:', errorData.error);
        return null;
      }

      const { user: newUser } = await response.json();

      // Add to local state
      set((state) => ({
        users: [newUser as UserProfile, ...state.users],
      }));

      return newUser as UserProfile;
    } catch (err) {
      console.error('Exception creating user:', err);
      return null;
    }
  },

  updateUser: async (userId: string, userData: UserFormData) => {
    try {
      // Use server-side API for user updates (supports password changes)
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, userData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating user:', errorData.error);
        return false;
      }

      // Update local state
      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId
            ? { 
                ...user, 
                user_name: userData.user_name,
                user_email: userData.user_email,
                role: userData.role,
                tier: userData.tier,
                points_balance: userData.points_balance,
                address_line1: userData.address_line1,
                city: userData.city,
                region_state_province: userData.region_state_province,
                province_id: userData.province_id ? parseInt(userData.province_id) : undefined,
                postal_code: userData.postal_code,
                recipient_name: userData.recipient_name,
                recipient_phoneno: userData.recipient_phoneno,
                recipient_address_line1: userData.recipient_address_line1,
                recipient_city: userData.recipient_city,
                recipient_region: userData.recipient_region,
                recipient_province_id: userData.recipient_province_id ? parseInt(userData.recipient_province_id) : undefined,
                recipient_postal_code: userData.recipient_postal_code,
                updated_at: new Date().toISOString(),
              }
            : user
        ),
      }));

      return true;
    } catch (err) {
      console.error('Exception updating user:', err);
      return false;
    }
  },

  approveUser: async (userId: string) => {
    try {
      const response = await fetch('/api/users/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error approving user:', errorData.error);
        return false;
      }

      // Update local state
      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId
            ? { ...user, is_approved: true, updated_at: new Date().toISOString() }
            : user
        ),
      }));

      return true;
    } catch (err) {
      console.error('Exception approving user:', err);
      return false;
    }
  },

  deleteUser: async (userId: string) => {
    try {
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error deleting user:', errorData.error);
        return false;
      }

      // Remove from local state
      set((state) => ({
        users: state.users.filter((user) => user.id !== userId),
      }));

      return true;
    } catch (err) {
      console.error('Exception deleting user:', err);
      return false;
    }
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));
