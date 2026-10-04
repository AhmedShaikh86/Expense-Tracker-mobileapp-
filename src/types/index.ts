/**
 * Shared TypeScript types for the whole app.
 *
 * Money is ALWAYS stored as an integer number of paisa (1 rupee = 100 paisa).
 * This avoids floating-point rounding errors (e.g. 0.1 + 0.2 !== 0.3).
 * Dates are stored as 'YYYY-MM-DD' strings (local date, no time zone),
 * timestamps (createdAt etc.) as ISO strings.
 */

export interface Expense {
  id: string;
  /** Amount in paisa (integer). */
  amount: number;
  categoryId: string;
  /** Local date, format 'YYYY-MM-DD'. */
  date: string;
  note: string;
  /** A recurring expense is a "template" that auto-creates one entry per month. */
  isRecurring: boolean;
  /** Day of the month (1-31) on which the recurring entry is created. */
  recurringDay: number | null;
  /** For auto-created entries: the id of the recurring template that created it. */
  recurringSourceId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Last time this row was pushed to the cloud (null = never synced). */
  syncedAt: string | null;
  /** Soft-delete marker so deletions can be synced (null = not deleted). */
  deletedAt: string | null;
}

export interface Category {
  id: string;
  name: string;
  /** An Ionicons glyph name, e.g. 'fast-food'. */
  icon: string;
  /** Hex color, e.g. '#FF7043'. */
  color: string;
  /** Optional monthly budget in paisa. */
  monthlyBudget: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  deletedAt: string | null;
}

/** An expense joined with its category (handy for lists). */
export interface ExpenseWithCategory extends Expense {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
}

/** Input used when creating or updating an expense from the form. */
export interface ExpenseInput {
  amount: number;
  categoryId: string;
  date: string;
  note: string;
  isRecurring: boolean;
  recurringDay: number | null;
}

/** Input used when creating or updating a category. */
export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
  monthlyBudget: number | null;
}

/** Filters for the Expenses list screen. All fields are optional. */
export interface ExpenseFilters {
  search?: string;
  categoryIds?: string[];
  fromDate?: string;
  toDate?: string;
  /** In paisa. */
  minAmount?: number;
  /** In paisa. */
  maxAmount?: number;
}

/** Total spent per category for a period (used by Stats and Budgets). */
export interface CategoryTotal {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  monthlyBudget: number | null;
  total: number;
}

/** Total spent per month (used by the 6-month bar chart). */
export interface MonthTotal {
  /** 'YYYY-MM' */
  month: string;
  total: number;
}

export type ThemeMode = 'system' | 'light' | 'dark';
