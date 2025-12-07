import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

interface DbSocialMediaLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapDbToLocal(db: DbSocialMediaLink): SocialMediaLink {
  return {
    id: db.id,
    platform: db.platform,
    url: db.url.replace(/%40/g, '@').replace(/%2B/g, '+'),
    icon: db.icon,
    displayOrder: db.display_order,
    isActive: db.is_active,
  };
}

function mapLocalToDb(local: Omit<SocialMediaLink, 'id'>) {
  return {
    platform: local.platform,
    url: local.url.replace(/@/g, '%40').replace(/\+/g, '%2B'),
    icon: local.icon,
    display_order: local.displayOrder,
    is_active: local.isActive,
  };
}

interface SocialMediaStore {
  links: SocialMediaLink[];
  loading: boolean;
  lastFetched: number | null;
  fetchLinks: () => Promise<void>;
  getActiveLinks: () => SocialMediaLink[];
  addLink: (link: Omit<SocialMediaLink, 'id'>) => Promise<SocialMediaLink | null>;
  updateLink: (id: string, updates: Partial<Omit<SocialMediaLink, 'id'>>) => Promise<boolean>;
  deleteLink: (id: string) => Promise<boolean>;
  invalidate: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useSocialMediaStore = create<SocialMediaStore>((set, get) => ({
  links: [],
  loading: false,
  lastFetched: null,

  fetchLinks: async () => {
    const state = get();
    
    // Skip if already loading
    if (state.loading) return;
    
    // Use cache if valid (check if we have cached data within cache duration)
    if (state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION) {
      return;
    }

    set({ loading: true });

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('social_media_links')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error loading social media links:', error);
        set({ links: [], loading: false, lastFetched: Date.now() });
      } else {
        set({ 
          links: (data || []).map(mapDbToLocal), 
          loading: false, 
          lastFetched: Date.now() 
        });
      }
    } catch (err) {
      console.error('Exception loading social media links:', err);
      set({ links: [], loading: false, lastFetched: Date.now() });
    }
  },

  getActiveLinks: () => {
    return get().links
      .filter((link) => link.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },

  addLink: async (link) => {
    const supabase = createClient();
    const payload = mapLocalToDb(link);

    const { data, error } = await supabase
      .from('social_media_links')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error adding social media link:', error);
      return null;
    }

    const newLink = mapDbToLocal(data);
    set((state) => ({ links: [...state.links, newLink] }));
    return newLink;
  },

  updateLink: async (id, updates) => {
    const supabase = createClient();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await supabase
      .from('social_media_links')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating social media link:', error);
      return false;
    }

    set((state) => ({
      links: state.links.map((link) =>
        link.id === id ? { ...link, ...updates } : link
      ),
    }));
    return true;
  },

  deleteLink: async (id) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('social_media_links')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting social media link:', error);
      return false;
    }

    set((state) => ({
      links: state.links.filter((link) => link.id !== id),
    }));
    return true;
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));

// Notify store to refetch
export function notifySocialMediaUpdated() {
  useSocialMediaStore.getState().invalidate();
  useSocialMediaStore.getState().fetchLinks();
}

export const AVAILABLE_SOCIAL_ICONS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'github', label: 'GitHub' },
] as const;
