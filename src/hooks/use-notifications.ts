'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotificationStore } from '@/store/notification-store';
import { useAuth } from '@/hooks/use-auth';
import type { Notification } from '@/types/database';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useNotifications() {
  const { user, isAdmin } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    setNotifications, 
    addNotification, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationStore();
  
  // Track channel to ensure proper cleanup
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    const supabase = createClient();
    
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // For regular users, get their notifications
    // For admins, also get system-wide notifications (user_id is null)
    if (isAdmin) {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (!error && data) {
      setNotifications(data as Notification[]);
    }
  }, [user, isAdmin, setNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    
    // Clean up previous channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload: { new: Notification }) => {
          const notification = payload.new as Notification;
          
          // Check if this notification is for the current user
          const isForCurrentUser = notification.user_id === user.id;
          const isSystemWide = notification.user_id === null && isAdmin;

          if (isForCurrentUser || isSystemWide) {
            addNotification(notification);
            
            // Show toast notification
            toast(notification.title, {
              description: notification.message,
              action: notification.action_link ? {
                label: 'View',
                onClick: () => window.location.href = notification.action_link!,
              } : undefined,
            });
          }
        }
      )
      .subscribe();
    
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, isAdmin, addNotification]);

  const handleMarkAsRead = async (id: string) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      markAsRead(id);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    const supabase = createClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      markAllAsRead();
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    refetch: fetchNotifications,
  };
}

// Helper function to create notifications (for server-side use)
export async function createNotification({
  userId,
  title,
  message,
  actionLink,
}: {
  userId?: string | null;
  title: string;
  message: string;
  actionLink?: string;
}) {
  const supabase = createClient();

  const { error } = await supabase.from('notifications').insert({
    user_id: userId || null,
    title,
    message,
    action_link: actionLink || null,
    is_read: false,
  });

  return { error };
}
