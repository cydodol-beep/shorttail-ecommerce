'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface LandingSection {
  id: string;
  section_key: string;
  section_name: string;
  is_visible: boolean;
  sort_order: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface LandingSectionsState {
  sections: LandingSection[];
  loading: boolean;
  fetched: boolean;
  lastFetched: number | null;
  error: string | null;
  fetchSections: (forceRefresh?: boolean) => Promise<void>;
  updateSection: (id: string, updates: Partial<LandingSection>) => Promise<void>;
  batchUpdateSections: (updates: Array<{ id: string; data: Partial<LandingSection> }>) => Promise<void>;
  getSectionByKey: (key: string) => LandingSection | undefined;
  getVisibleSections: () => LandingSection[];
  invalidateCache: () => void;
}

const CACHE_DURATION = 30 * 1000;

const STORAGE_KEY = 'landing_sections_updated';

export const useLandingSectionsStore = create<LandingSectionsState>((set, get) => ({
  sections: [],
  loading: false,
  fetched: false,
  lastFetched: null,
  error: null,

  fetchSections: async (forceRefresh = false) => {
    const now = Date.now();

    // Use cached data if available
    const lastFetched = get().lastFetched;
    const hasValidCache = !forceRefresh && lastFetched && now - lastFetched < CACHE_DURATION;
    if (hasValidCache) {
      console.log('[LandingSections] Using cached data');
      return;
    }
    if (hasValidCache) {
      console.log('[LandingSections] Using cached data');
      return;
    }

    // Proceed with fetch if not currently loading OR force refresh
    if (!get().loading || forceRefresh) {
      console.log('[LandingSections] Fetching sections...', forceRefresh ? '(forced)' : '');
      set({ loading: true, error: null });

      const supabase = createClient();

      // Add timeout to prevent hanging
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 10000);

      try {
        const { data, error } = await supabase
          .from('landing_page_sections')
          .select('*')
          .order('sort_order', { ascending: true })
          .abortSignal(abortController.signal);

        clearTimeout(timeoutId);

        if (error) {
          console.error('[LandingSections] Error fetching:', error.message);
          set({ error: error.message, loading: false, fetched: true });
        } else {
          console.log('[LandingSections] Fetched sections:', data?.length, 'sections');
          set({ sections: data || [], loading: false, fetched: true, lastFetched: now });
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('[LandingSections] Exception:', err);
        }
        set({ error: err instanceof Error ? err.message : 'Unknown error', loading: false, fetched: true });
      }

      return;
    }
  },

  updateSection: async (id: string, updates: Partial<LandingSection>) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('landing_page_sections')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    // Immediately invalidate cache
    console.log('[LandingSections] Invalidating cache after update');
    set({ lastFetched: null, fetched: false });

    // Force immediate fetch to update all components
    const { data } = await supabase
      .from('landing_page_sections')
      .select('*')
      .order('sort_order', { ascending: true });

    if (data) {
      console.log('[LandingSections] Immediate update with fresh data:', data.length, 'sections');
      set({ sections: data, lastFetched: Date.now(), fetched: true });
    }

    // Notify other tabs/windows about the update
    if (typeof window !== 'undefined') {
      const updateEvent = {
        timestamp: Date.now(),
        source: 'admin',
        action: 'update'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updateEvent));
      setTimeout(() => localStorage.removeItem(STORAGE_KEY), 100);

      // Also dispatch a custom event for same-page updates
      window.dispatchEvent(new CustomEvent('landing-sections-updated', { detail: updateEvent }));
    }
  },

  batchUpdateSections: async (updates: Array<{ id: string; data: Partial<LandingSection> }>) => {
    const supabase = createClient();

    console.log('[LandingSections] Batch updating sections:', updates);

    const updatePromises = updates.map(({ id, data }) => {
      console.log(`[LandingSections] Updating section ${id} with:`, data);
      return supabase
        .from('landing_page_sections')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
    });

    const results = await Promise.all(updatePromises);

    console.log('[LandingSections] Update results:', results);

    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('[LandingSections] Batch update errors:', errors.map(e => e.error));
      throw new Error(errors[0].error!.message);
    }

    console.log('[LandingSections] Batch update successful');

    // Immediately invalidate cache
    console.log('[LandingSections] Invalidating cache after batch update');
    set({ lastFetched: null, fetched: false });

    // Single fetch to update all components
    const { data } = await supabase
      .from('landing_page_sections')
      .select('*')
      .order('sort_order', { ascending: true });

    if (data) {
      console.log('[LandingSections] Immediate update with fresh data:', data.length, 'sections');
      set({ sections: data, lastFetched: Date.now(), fetched: true });
    }

    // Notify other tabs/windows about the update
    if (typeof window !== 'undefined') {
      const updateEvent = {
        timestamp: Date.now(),
        source: 'admin',
        action: 'batch_update'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updateEvent));
      setTimeout(() => localStorage.removeItem(STORAGE_KEY), 100);
      window.dispatchEvent(new CustomEvent('landing-sections-updated', { detail: updateEvent }));
    }
  },

  invalidateCache: () => {
    console.log('[LandingSections] Cache invalidated');
    set({ lastFetched: null, fetched: false });
  },

  getSectionByKey: (key: string) => {
    return get().sections.find((s) => s.section_key === key);
  },

  getVisibleSections: () => {
    return get().sections.filter((s) => s.is_visible).sort((a, b) => a.sort_order - b.sort_order);
  },

  getSectionSettings: (sectionKey: string, defaultSettings: Record<string, any>) => {
    const section = get().sections.find((s) => s.section_key === sectionKey);

    if (section) {
      const settings = { ...defaultSettings };
      Object.keys(section.settings || {}).forEach((key) => {
        if (section.settings && key in section.settings) {
          settings[key] = section.settings[key];
        }
      });

      console.log(`[getSectionSettings] Section ${sectionKey} settings:`, settings);
      return settings;
    }

    console.log(`[getSectionSettings] Section ${sectionKey} not found, using defaults`);
    return defaultSettings;
  },
}));
