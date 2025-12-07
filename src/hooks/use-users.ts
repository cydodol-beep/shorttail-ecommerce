'use client';

import { useEffect } from 'react';
import {
  useUsersStore,
  type UserProfile,
  type UserFormData,
} from '@/store/users-store';

export type { UserProfile, UserFormData };

export function useUsers() {
  const users = useUsersStore((state) => state.users);
  const loading = useUsersStore((state) => state.loading);

  useEffect(() => {
    useUsersStore.getState().fetchUsers();
  }, []);

  return {
    users,
    loading,
    refresh: () => {
      useUsersStore.getState().invalidate();
      useUsersStore.getState().fetchUsers();
    },
  };
}

export async function updateUserRole(userId: string, role: string): Promise<boolean> {
  return useUsersStore.getState().updateUserRole(userId, role);
}

export async function createUser(userData: UserFormData): Promise<UserProfile | null> {
  return useUsersStore.getState().createUser(userData);
}

export async function updateUser(userId: string, userData: UserFormData): Promise<boolean> {
  return useUsersStore.getState().updateUser(userId, userData);
}

export async function approveUser(userId: string): Promise<boolean> {
  return useUsersStore.getState().approveUser(userId);
}

export async function deleteUser(userId: string): Promise<boolean> {
  return useUsersStore.getState().deleteUser(userId);
}
