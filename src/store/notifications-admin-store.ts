import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface Notification {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  title: string;
  message: string;
  is_read: boolean;
  action_link?: string;
  created_at: string;
}

export interface NotificationFormData {
  user_id?: string;
  title: string;
  message: string;
  action_link?: string;
}

interface NotificationsAdminStore {
  notifications: Notification[];
  loading: boolean;
  lastFetched: number | null;
  fetchNotifications: () => Promise<void>;
  createNotification: (data: NotificationFormData) => Promise<Notification | null>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  invalidate: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useNotificationsAdminStore = create<NotificationsAdminStore>((set, get) => ({
  notifications: [],
  loading: false,
  lastFetched: null,

  fetchNotifications: async () => {
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

      console.log('Fetching all notifications from Supabase...');

      // Fetch all notifications (admin can see all)
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        set({ loading: false });
        return;
      }

      console.log('Notifications fetch result:', { count: notificationsData?.length || 0 });

      // Fetch user info for user-specific notifications
      const userIds = [...new Set((notificationsData || [])
        .map((n: any) => n.user_id)
        .filter(Boolean))];

      interface UserProfile {
        id: string;
        user_name: string;
        email: string;
      }

      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, user_name, email')
        .in('id', userIds);

      const usersMap = new Map<string, UserProfile>((usersData || []).map((u: any) => [u.id, u]));

      const notifications = (notificationsData || []).map((notification: any) => {
        const user = notification.user_id ? usersMap.get(notification.user_id) : null;

        return {
          id: notification.id,
          user_id: notification.user_id,
          user_name: user?.user_name,
          user_email: user?.email,
          title: notification.title,
          message: notification.message,
          is_read: notification.is_read,
          action_link: notification.action_link,
          created_at: notification.created_at,
        } as Notification;
      });

      set({
        notifications,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error('Exception fetching notifications:', err);
      set({ loading: false });
    }
  },

  createNotification: async (data: NotificationFormData) => {
    try {
      const supabase = createClient();

      const { data: newNotification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id || null,
          title: data.title,
          message: data.message,
          action_link: data.action_link || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      // Add to local state
      const notification = {
        id: newNotification.id,
        user_id: newNotification.user_id,
        title: newNotification.title,
        message: newNotification.message,
        is_read: newNotification.is_read,
        action_link: newNotification.action_link,
        created_at: newNotification.created_at,
      } as Notification;

      set((state) => ({
        notifications: [notification, ...state.notifications],
      }));

      return notification;
    } catch (err) {
      console.error('Exception creating notification:', err);
      return null;
    }
  },

  markAsRead: async (id: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
      }));

      return true;
    } catch (err) {
      console.error('Exception marking notification as read:', err);
      return false;
    }
  },

  markAllAsRead: async () => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      }));

      return true;
    } catch (err) {
      console.error('Exception marking all notifications as read:', err);
      return false;
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      // Remove from local state
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));

      return true;
    } catch (err) {
      console.error('Exception deleting notification:', err);
      return false;
    }
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));
