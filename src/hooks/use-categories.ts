'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  useCategoriesStore, 
  notifyCategoriesUpdated,
  type Category 
} from '@/store/categories-store';

export type { Category };

export function useCategories() {
  const categories = useCategoriesStore((state) => state.categories);
  const loading = useCategoriesStore((state) => state.loading);
  const error = useCategoriesStore((state) => state.error);
  const getActiveCategories = useCategoriesStore((state) => state.getActiveCategories);
  const getCategoryBySlug = useCategoriesStore((state) => state.getCategoryBySlug);
  const getCategoryById = useCategoriesStore((state) => state.getCategoryById);

  // Fetch on mount if not already loaded - use getState() to avoid dependency
  useEffect(() => {
    const state = useCategoriesStore.getState();
    // Only fetch if we don't have data or it's stale
    if (!state.loading && (!state.lastFetched || state.categories.length === 0)) {
      state.fetchCategories();
    }
  }, []);

  return {
    categories,
    loading,
    error,
    getActiveCategories,
    getCategoryBySlug,
    getCategoryById,
    refresh: () => {
      useCategoriesStore.getState().invalidate();
      useCategoriesStore.getState().fetchCategories();
    },
  };
}

export { notifyCategoriesUpdated };

// CRUD operations for categories
export async function createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

  if (!error) {
    notifyCategoriesUpdated();
  }

  return { data, error };
}

export async function updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (!error) {
    notifyCategoriesUpdated();
  }

  return { data, error };
}

export async function deleteCategory(id: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (!error) {
    notifyCategoriesUpdated();
  }

  return { error };
}

// Utility function to get categories for select options
export async function getCategoryOptions(): Promise<{ value: string; label: string }[]> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('categories')
    .select('slug, name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return (data || []).map((c: { slug: string; name: string }) => ({ value: c.slug, label: c.name }));
}
