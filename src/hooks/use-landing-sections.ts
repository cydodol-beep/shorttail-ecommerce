'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useLandingSectionsStore, type LandingSection } from '@/store/landing-sections-store';

export type { LandingSection };

// Storage key for cross-tab communication (must match store)
const STORAGE_KEY = 'landing_sections_updated';

export function useLandingSections() {
  const sections = useLandingSectionsStore((state) => state.sections);
  const loading = useLandingSectionsStore((state) => state.loading);
  const fetched = useLandingSectionsStore((state) => state.fetched);
  const fetchSections = useLandingSectionsStore((state) => state.fetchSections);
  const lastFetched = useLandingSectionsStore((state) => state.lastFetched);
  const invalidateCache = useLandingSectionsStore((state) => state.invalidateCache);

  // Force refresh function
  const forceRefresh = useCallback(() => {
    invalidateCache();
    fetchSections(true);
  }, [invalidateCache, fetchSections]);

  useEffect(() => {
    // Fetch on mount only
    useLandingSectionsStore.getState().fetchSections();

    // Listen for same-page updates (from admin panel)
    const handleCustomUpdate = (e: CustomEvent) => {
      console.log('[LandingSections] Custom update event detected:', e.detail);
      useLandingSectionsStore.getState().invalidateCache();
      useLandingSectionsStore.getState().fetchSections(true);
    };

    // Listen for cross-tab updates via localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updateEvent = JSON.parse(e.newValue);
          console.log('[LandingSections] Cross-tab update detected:', updateEvent);
          useLandingSectionsStore.getState().invalidateCache();
          useLandingSectionsStore.getState().fetchSections(true);
        } catch (err) {
          // Fallback for old string format
          console.log('[LandingSections] Cross-tab update detected (legacy)');
          useLandingSectionsStore.getState().invalidateCache();
          useLandingSectionsStore.getState().fetchSections(true);
        }
      }
    };

    // Refresh when window gains focus (user switches back to tab)
    const handleFocus = () => {
      console.log('[LandingSections] Window focused, refreshing...');
      useLandingSectionsStore.getState().fetchSections(true);
    };

    // Refresh on visibility change (more reliable than focus in some cases)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[LandingSections] Tab became visible, refreshing...');
        useLandingSectionsStore.getState().fetchSections(true);
      }
    };

    window.addEventListener('landing-sections-updated', handleCustomUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('landing-sections-updated', handleCustomUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Empty dependencies - only run once on mount

  // Create a stable reference for helper functions that depend on sections
  const helpers = useMemo(() => ({
    getSectionByKey: (key: string): LandingSection | undefined => {
      return sections.find((s) => s.section_key === key);
    },
    
    isSectionVisible: (key: string): boolean => {
      // If we have sections data, use it regardless of fetched status
      if (sections.length > 0) {
        const section = sections.find((s) => s.section_key === key);
        return section ? section.is_visible : true;
      }
      // If no data yet, show all sections by default (first load)
      return true;
    },
    
    getSectionSettings: <T extends Record<string, any>>(key: string, defaults: T): T => {
      const section = sections.find((s) => s.section_key === key);
      return { ...defaults, ...(section?.settings || {}) } as T;
    },
    
    getVisibleSections: (): LandingSection[] => {
      return sections.filter((s) => s.is_visible).sort((a, b) => a.sort_order - b.sort_order);
    },
  }), [sections, fetched]);

  return {
    sections,
    loading,
    fetched,
    lastFetched,
    ...helpers,
    refresh: fetchSections,
    forceRefresh,
    invalidateCache,
  };
}
