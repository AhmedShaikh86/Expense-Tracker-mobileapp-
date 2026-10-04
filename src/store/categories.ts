import { create } from 'zustand';

import * as db from '@/db/categories';
import { scheduleSync } from '@/services/sync';
import type { Category, CategoryInput } from '@/types';

import { notifyDataChanged } from './data';

/**
 * Categories are few and used on almost every screen, so we keep them in
 * memory. The database is still the source of truth: every action writes to
 * SQLite first and then reloads the list.
 */
interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (input: CategoryInput) => Promise<string>;
  update: (id: string, input: CategoryInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setBudget: (id: string, monthlyBudget: number | null) => Promise<void>;
  getById: (id: string) => Category | undefined;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => {
  /** Shared "after a change" steps: reload, refresh screens, sync later. */
  const afterChange = async () => {
    await get().load();
    notifyDataChanged();
    scheduleSync();
  };

  return {
    categories: [],
    isLoading: true,
    error: null,

    load: async () => {
      try {
        const categories = await db.getCategories();
        set({ categories, isLoading: false, error: null });
      } catch (e) {
        set({ isLoading: false, error: e instanceof Error ? e.message : 'Could not load categories' });
      }
    },

    add: async (input) => {
      const id = await db.createCategory(input);
      await afterChange();
      return id;
    },

    update: async (id, input) => {
      await db.updateCategory(id, input);
      await afterChange();
    },

    remove: async (id) => {
      await db.deleteCategory(id);
      await afterChange();
    },

    setBudget: async (id, monthlyBudget) => {
      await db.setCategoryBudget(id, monthlyBudget);
      await afterChange();
    },

    getById: (id) => get().categories.find((c) => c.id === id),
  };
});
