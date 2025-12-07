'use client';

import { useEffect } from 'react';
import {
  useSocialMediaStore,
  notifySocialMediaUpdated,
  type SocialMediaLink,
  AVAILABLE_SOCIAL_ICONS,
} from '@/store/social-media-store';

export type { SocialMediaLink };

export function useSocialMedia() {
  const links = useSocialMediaStore((state) => state.links);
  const loading = useSocialMediaStore((state) => state.loading);
  const getActiveLinks = useSocialMediaStore((state) => state.getActiveLinks);

  useEffect(() => {
    useSocialMediaStore.getState().fetchLinks();
  }, []);

  return {
    links,
    loading,
    getActiveLinks,
    refresh: () => {
      useSocialMediaStore.getState().invalidate();
      useSocialMediaStore.getState().fetchLinks();
    },
  };
}

export async function fetchSocialMediaLinks(): Promise<SocialMediaLink[]> {
  await useSocialMediaStore.getState().fetchLinks();
  return useSocialMediaStore.getState().links;
}

export async function addSocialMediaLink(
  link: Omit<SocialMediaLink, 'id'>
): Promise<SocialMediaLink | null> {
  return useSocialMediaStore.getState().addLink(link);
}

export async function updateSocialMediaLink(
  id: string,
  updates: Partial<Omit<SocialMediaLink, 'id'>>
): Promise<boolean> {
  return useSocialMediaStore.getState().updateLink(id, updates);
}

export async function deleteSocialMediaLink(id: string): Promise<boolean> {
  return useSocialMediaStore.getState().deleteLink(id);
}

export { AVAILABLE_SOCIAL_ICONS, notifySocialMediaUpdated };
