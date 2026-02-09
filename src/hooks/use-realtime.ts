'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Real-time Notifications Hook
 * 
 * This hook subscribes to Supabase Realtime for instant notifications.
 * It handles:
 * - Order status updates for customers
 * - New order broadcasts for kasir/admin
 * - Toast notifications
 * - Connection management
 * 
 * Usage:
 * ```tsx
 * // In your layout or page component
 * function MyPage() {
 *   const { isConnected, unreadCount } = useRealtimeNotifications({
 *     userId: currentUser?.id,
 *     userRole: currentUser?.role,
 *     onNotification: (notification) => console.log(notification),
 *   });
 *   
 *   return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */

/**
 * Notification types from database
 */
type NotificationType = 'order_update' | 'new_order' | 'promotion' | 'system';

/**
 * Notification data structure
 */
interface Notification {
  id: string;
  user_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_broadcast: boolean;
  target_role: string | null;
  is_read: boolean;
  action_link: string | null;
  created_at: string;
  read_at: string | null;
}

/**
 * Hook options
 */
interface UseRealtimeNotificationsOptions {
  /** Current user ID */
  userId?: string;
  /** Current user role (for broadcast notifications) */
  userRole?: string;
  /** Callback when a new notification arrives */
  onNotification?: (notification: Notification) => void;
  /** Whether to show toast notifications */
  showToasts?: boolean;
  /** Filter by notification types */
  filterTypes?: NotificationType[];
}

/**
 * Hook return value
 */
interface UseRealtimeNotificationsReturn {
  /** Whether connected to realtime */
  isConnected: boolean;
  /** Unread notification count */
  unreadCount: number;
  /** Recent notifications */
  notifications: Notification[];
  /** Manually refresh connection */
  reconnect: () => void;
  /** Mark a notification as read */
  markAsRead: (notificationId: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
}

/**
 * Hook for real-time notifications using Supabase Realtime
 */
export function useRealtimeNotifications({
  userId,
  userRole,
  onNotification,
  showToasts = true,
  filterTypes,
}: UseRealtimeNotificationsOptions = {}): UseRealtimeNotificationsReturn {
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Show toast notification based on type
   */
  const showToast = useCallback((notification: Notification) => {
    if (!showToasts) return;

    const config = {
      description: notification.message,
      action: notification.action_link
        ? {
            label: 'Lihat',
            onClick: () => {
              window.location.href = notification.action_link!;
            },
          }
        : undefined,
    };

    switch (notification.type) {
      case 'order_update':
        toast.success(notification.title, config);
        break;
      case 'new_order':
        toast.info(notification.title, {
          ...config,
          duration: 10000, // Keep new order notifications longer
        });
        break;
      case 'promotion':
        toast(notification.title, {
          ...config,
          icon: '🎉',
        });
        break;
      case 'system':
        toast.warning(notification.title, config);
        break;
      default:
        toast(notification.title, config);
    }
  }, [showToasts]);

  /**
   * Handle incoming realtime notification
   */
  const handleNotification = useCallback((payload: RealtimePostgresChangesPayload<Notification>) => {
    if (payload.eventType !== 'INSERT') return;

    const notification = payload.new;

    // Filter by type if specified
    if (filterTypes && !filterTypes.includes(notification.type)) {
      return;
    }

    // Update state
    setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50
    
    if (!notification.is_read) {
      setUnreadCount((prev) => prev + 1);
    }

    // Show toast
    showToast(notification);

    // Call external handler
    onNotification?.(notification);
  }, [filterTypes, onNotification, showToast]);

  /**
   * Subscribe to realtime notifications
   */
  const subscribe = useCallback(() => {
    if (!userId && !userRole) {
      console.log('useRealtimeNotifications: No user ID or role provided, skipping subscription');
      return;
    }

    // Unsubscribe from existing channel
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Create new channel
    const channel = supabase
      .channel('notifications', {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications_broadcast',
        },
        handleNotification
      )
      .subscribe((status: string) => {
        console.log('Realtime notifications status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  }, [supabase, userId, userRole, handleNotification]);

  /**
   * Unsubscribe from notifications
   */
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  /**
   * Reconnect to realtime
   */
  const reconnect = useCallback(() => {
    unsubscribe();
    subscribe();
  }, [subscribe, unsubscribe]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications_broadcast')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [supabase]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .rpc('mark_all_notifications_read', { p_user_id: userId });

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [supabase, userId]);

  /**
   * Fetch initial unread count
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_unread_notification_count', { p_user_id: userId });

      if (error) throw error;
      setUnreadCount(data || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [supabase, userId]);

  /**
   * Fetch recent notifications
   */
  const fetchNotifications = useCallback(async () => {
    if (!userId && !userRole) return;

    try {
      let query = supabase
        .from('notifications_broadcast')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (userId) {
        // User-specific notifications OR broadcast for their role
        query = query.or(
          `user_id.eq.${userId},and(is_broadcast.eq.true,target_role.eq.${userRole})`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [supabase, userId, userRole]);

  // Subscribe on mount
  useEffect(() => {
    subscribe();
    fetchUnreadCount();
    fetchNotifications();

    // Handle visibility change for reconnection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [subscribe, unsubscribe, reconnect, fetchUnreadCount, fetchNotifications, isConnected]);

  return {
    isConnected,
    unreadCount,
    notifications,
    reconnect,
    markAsRead,
    markAllAsRead,
  };
}

/**
 * Hook specifically for order status updates
 * 
 * Usage:
 * ```tsx
 * useOrderStatusRealtime({
 *   orderId: 'order-123',
 *   onStatusChange: (newStatus, oldStatus) => {
 *     console.log(`Order status changed from ${oldStatus} to ${newStatus}`);
 *   },
 * });
 * ```
 */
interface UseOrderStatusRealtimeOptions {
  orderId?: string;
  onStatusChange?: (newStatus: string, oldStatus: string) => void;
}

export function useOrderStatusRealtime({
  orderId,
  onStatusChange,
}: UseOrderStatusRealtimeOptions) {
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: { old?: { status?: string }; new?: { status?: string } }) => {
          const oldStatus = payload.old?.status;
          const newStatus = payload.new?.status;

          if (oldStatus !== newStatus) {
            onStatusChange?.(newStatus || '', oldStatus || '');
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, orderId, onStatusChange]);
}

/**
 * Hook for admin/kasir new order alerts
 * 
 * Usage:
 * ```tsx
 * useNewOrderAlerts({
 *   userRole: 'kasir',
 *   onNewOrder: (order) => {
 *     console.log('New order received:', order);
 *   },
 * });
 * ```
 */
interface UseNewOrderAlertsOptions {
  userRole?: string;
  onNewOrder?: (order: Record<string, unknown>) => void;
}

export function useNewOrderAlerts({ userRole, onNewOrder }: UseNewOrderAlertsOptions) {
  const supabase = createClient();

  useEffect(() => {
    if (!userRole || !['kasir', 'admin', 'super_user'].includes(userRole)) {
      return;
    }

    const channel = supabase
      .channel('new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications_broadcast',
          filter: `type=eq.new_order`,
        },
        (payload: { new: Notification }) => {
          const notification = payload.new;
          
          // Check if this notification is for this user's role
          if (
            notification.is_broadcast &&
            notification.target_role === userRole
          ) {
            onNewOrder?.(notification.metadata);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, userRole, onNewOrder]);
}

export default useRealtimeNotifications;