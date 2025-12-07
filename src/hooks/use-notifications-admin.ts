'use client';

import { useEffect } from 'react';
import { useNotificationsAdminStore } from '@/store/notifications-admin-store';

export function useNotificationsAdmin() {
  const store = useNotificationsAdminStore();

  useEffect(() => {
    store.fetchNotifications();
  }, []);

  return store;
}

export const createNotification = useNotificationsAdminStore.getState().createNotification;
export const markAsRead = useNotificationsAdminStore.getState().markAsRead;
export const markAllAsRead = useNotificationsAdminStore.getState().markAllAsRead;
export const deleteNotification = useNotificationsAdminStore.getState().deleteNotification;
export const invalidateNotifications = useNotificationsAdminStore.getState().invalidate;
