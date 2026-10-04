import type { Category, CategoryInput } from '@/types';
import { nowTimestamp } from '@/utils/date';
import { newId } from '@/utils/id';

import { getDb } from './client';

/** Category id that expenses are moved to when their category is deleted. */
export const FALLBACK_CATEGORY_ID = 'default-other';

/** The raw row shape as stored in SQLite (snake_case, 0/1 booleans). */
export interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthly_budget: number | null;
  is_default: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  deleted_at: string | null;
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    monthlyBudget: row.monthly_budget,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    deletedAt: row.deleted_at,
  };
}

/** All non-deleted categories, defaults first, then alphabetical. */
export async function getCategories(): Promise<Category[]> {
  const rows = await getDb().getAllAsync<CategoryRow>(
    `SELECT * FROM categories WHERE deleted_at IS NULL
     ORDER BY is_default DESC, name COLLATE NOCASE ASC`,
  );
  return rows.map(mapCategory);
}

export async function getCategory(id: string): Promise<Category | null> {
  const row = await getDb().getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', id);
  return row ? mapCategory(row) : null;
}

export async function createCategory(input: CategoryInput): Promise<string> {
  const id = newId();
  const now = nowTimestamp();
  await getDb().runAsync(
    `INSERT INTO categories (id, name, icon, color, monthly_budget, is_default, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    id,
    input.name.trim(),
    input.icon,
    input.color,
    input.monthlyBudget,
    now,
    now,
  );
  return id;
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  await getDb().runAsync(
    `UPDATE categories SET name = ?, icon = ?, color = ?, monthly_budget = ?, updated_at = ?
     WHERE id = ?`,
    input.name.trim(),
    input.icon,
    input.color,
    input.monthlyBudget,
    nowTimestamp(),
    id,
  );
}

/** Sets (or clears, with null) only the monthly budget of a category. */
export async function setCategoryBudget(id: string, monthlyBudget: number | null): Promise<void> {
  await getDb().runAsync(
    'UPDATE categories SET monthly_budget = ?, updated_at = ? WHERE id = ?',
    monthlyBudget,
    nowTimestamp(),
    id,
  );
}

/**
 * Soft-deletes a custom category. Its expenses are moved to "Other" so no
 * expense is ever left without a category. Default categories can't be deleted.
 */
export async function deleteCategory(id: string): Promise<void> {
  const db = getDb();
  const now = nowTimestamp();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE expenses SET category_id = ?, updated_at = ? WHERE category_id = ?',
      FALLBACK_CATEGORY_ID,
      now,
      id,
    );
    await db.runAsync(
      'UPDATE categories SET deleted_at = ?, updated_at = ? WHERE id = ? AND is_default = 0',
      now,
      now,
      id,
    );
  });
}

/** Number of (non-deleted) expenses in a category, shown in the delete confirmation. */
export async function countExpensesInCategory(id: string): Promise<number> {
  const row = await getDb().getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM expenses WHERE category_id = ? AND deleted_at IS NULL',
    id,
  );
  return row?.count ?? 0;
}

// ---------- Sync helpers ----------

/** Rows changed locally since their last successful push. */
export async function getDirtyCategories(): Promise<CategoryRow[]> {
  return getDb().getAllAsync<CategoryRow>(
    'SELECT * FROM categories WHERE synced_at IS NULL OR updated_at > synced_at',
  );
}

/**
 * Marks a row as synced — but only if it wasn't edited again while we were
 * uploading (that's why we also match on updated_at).
 */
export async function markCategorySynced(id: string, updatedAt: string): Promise<void> {
  await getDb().runAsync(
    'UPDATE categories SET synced_at = updated_at WHERE id = ? AND updated_at = ?',
    id,
    updatedAt,
  );
}

/** Writes a row received from the cloud (already known to be newer than ours). */
export async function upsertCategoryFromRemote(row: Omit<CategoryRow, 'synced_at'>): Promise<void> {
  await getDb().runAsync(
    `INSERT OR REPLACE INTO categories
      (id, name, icon, color, monthly_budget, is_default, created_at, updated_at, synced_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    row.id,
    row.name,
    row.icon,
    row.color,
    row.monthly_budget,
    row.is_default,
    row.created_at,
    row.updated_at,
    row.updated_at,
    row.deleted_at,
  );
}

export async function getCategoryUpdatedAt(id: string): Promise<string | null> {
  const row = await getDb().getFirstAsync<{ updated_at: string }>(
    'SELECT updated_at FROM categories WHERE id = ?',
    id,
  );
  return row?.updated_at ?? null;
}
