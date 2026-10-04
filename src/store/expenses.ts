import { create } from 'zustand';

import * as db from '@/db/expenses';
import { scheduleSync } from '@/services/sync';
import type { ExpenseInput } from '@/types';

import { notifyDataChanged } from './data';

/**
 * Actions that change expenses. Lists are NOT kept here: each screen runs its
 * own query (filtered list, totals, charts) and reloads when data changes.
 * This keeps memory small even with thousands of expenses.
 */
interface ExpensesState {
  add: (input: ExpenseInput) => Promise<string>;
  update: (id: string, input: ExpenseInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  stopRecurring: (id: string) => Promise<void>;
}

function afterChange() {
  notifyDataChanged();
  scheduleSync();
}

export const useExpensesStore = create<ExpensesState>(() => ({
  add: async (input) => {
    const id = await db.createExpense(input);
    afterChange();
    return id;
  },
  update: async (id, input) => {
    await db.updateExpense(id, input);
    afterChange();
  },
  remove: async (id) => {
    await db.deleteExpense(id);
    afterChange();
  },
  stopRecurring: async (id) => {
    await db.stopRecurring(id);
    afterChange();
  },
}));
