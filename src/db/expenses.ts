import type { SQLiteBindValue } from 'expo-sqlite';

import type {
  CategoryTotal,
  Expense,
  ExpenseFilters,
  ExpenseInput,
  ExpenseWithCategory,
  MonthTotal,
} from '@/types';
import { nowTimestamp } from '@/utils/date';
import { newId } from '@/utils/id';

import { getDb } from './client';
import { seedDefaultCategories } from './migrations';

/** The raw row shape as stored in SQLite. */
export interface ExpenseRow {
  id: string;
  amount: number;
  category_id: string;
  date: string;
  note: string;
  is_recurring: number;
  recurring_day: number | null;
  recurring_source_id: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  deleted_at: string | null;
}

interface ExpenseWithCategoryRow extends ExpenseRow {
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
}

export function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: row.amount,
    categoryId: row.category_id,
    date: row.date,
    note: row.note,
    isRecurring: row.is_recurring === 1,
    recurringDay: row.recurring_day,
    recurringSourceId: row.recurring_source_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    deletedAt: row.deleted_at,
  };
}

function mapExpenseWithCategory(row: ExpenseWithCategoryRow): ExpenseWithCategory {
  return {
    ...mapExpense(row),
    // A LEFT JOIN may find no category (e.g. not synced yet) – show a safe fallback.
    categoryName: row.category_name ?? 'Uncategorized',
    categoryIcon: row.category_icon ?? 'help-circle',
    categoryColor: row.category_color ?? '#6B7280',
  };
}

/** SELECT used by every list query: expense + its category's name/icon/color. */
const SELECT_WITH_CATEGORY = `
  SELECT e.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
  FROM expenses e
  LEFT JOIN categories c ON c.id = e.category_id
`;

// ---------- Reading ----------

/** Expenses matching the given filters, newest first. */
export async function listExpenses(filters: ExpenseFilters = {}): Promise<ExpenseWithCategory[]> {
  const where: string[] = ['e.deleted_at IS NULL'];
  const params: SQLiteBindValue[] = [];

  if (filters.search?.trim()) {
    where.push('(e.note LIKE ? OR c.name LIKE ?)');
    const like = `%${filters.search.trim()}%`;
    params.push(like, like);
  }
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    where.push(`e.category_id IN (${filters.categoryIds.map(() => '?').join(', ')})`);
    params.push(...filters.categoryIds);
  }
  if (filters.fromDate) {
    where.push('e.date >= ?');
    params.push(filters.fromDate);
  }
  if (filters.toDate) {
    where.push('e.date <= ?');
    params.push(filters.toDate);
  }
  if (filters.minAmount !== undefined) {
    where.push('e.amount >= ?');
    params.push(filters.minAmount);
  }
  if (filters.maxAmount !== undefined) {
    where.push('e.amount <= ?');
    params.push(filters.maxAmount);
  }

  const rows = await getDb().getAllAsync<ExpenseWithCategoryRow>(
    `${SELECT_WITH_CATEGORY} WHERE ${where.join(' AND ')} ORDER BY e.date DESC, e.created_at DESC`,
    params,
  );
  return rows.map(mapExpenseWithCategory);
}

export async function getRecentExpenses(limit: number): Promise<ExpenseWithCategory[]> {
  const rows = await getDb().getAllAsync<ExpenseWithCategoryRow>(
    `${SELECT_WITH_CATEGORY} WHERE e.deleted_at IS NULL
     ORDER BY e.date DESC, e.created_at DESC LIMIT ?`,
    limit,
  );
  return rows.map(mapExpenseWithCategory);
}

export async function getExpense(id: string): Promise<Expense | null> {
  const row = await getDb().getFirstAsync<ExpenseRow>(
    'SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL',
    id,
  );
  return row ? mapExpense(row) : null;
}

/** Sum of all expenses between two dates (inclusive), in paisa. */
export async function getTotalBetween(start: string, end: string): Promise<number> {
  const row = await getDb().getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) AS total FROM expenses WHERE deleted_at IS NULL AND date BETWEEN ? AND ?',
    start,
    end,
  );
  return row?.total ?? 0;
}

/**
 * Spending per category between two dates. Includes every category (even
 * with 0 spent) so the Budgets screen can list them all.
 */
export async function getCategoryTotals(start: string, end: string): Promise<CategoryTotal[]> {
  return getDb().getAllAsync<CategoryTotal>(
    `SELECT c.id AS categoryId, c.name AS name, c.icon AS icon, c.color AS color,
            c.monthly_budget AS monthlyBudget,
            COALESCE(SUM(e.amount), 0) AS total
     FROM categories c
     LEFT JOIN expenses e
       ON e.category_id = c.id AND e.deleted_at IS NULL AND e.date BETWEEN ? AND ?
     WHERE c.deleted_at IS NULL
     GROUP BY c.id
     ORDER BY total DESC, c.name COLLATE NOCASE ASC`,
    start,
    end,
  );
}

/** Totals per month ('YYYY-MM') between two dates. Months with no spending are omitted. */
export async function getMonthlyTotals(start: string, end: string): Promise<MonthTotal[]> {
  return getDb().getAllAsync<MonthTotal>(
    `SELECT substr(date, 1, 7) AS month, SUM(amount) AS total
     FROM expenses
     WHERE deleted_at IS NULL AND date BETWEEN ? AND ?
     GROUP BY month ORDER BY month ASC`,
    start,
    end,
  );
}

/** "Template" expenses that repeat every month. */
export async function getRecurringExpenses(): Promise<ExpenseWithCategory[]> {
  const rows = await getDb().getAllAsync<ExpenseWithCategoryRow>(
    `${SELECT_WITH_CATEGORY} WHERE e.deleted_at IS NULL AND e.is_recurring = 1
     ORDER BY e.recurring_day ASC`,
  );
  return rows.map(mapExpenseWithCategory);
}

/**
 * True if a recurring template already produced an entry in the given date range.
 * Deleted entries count too, so an entry the user deleted is not re-created.
 */
export async function hasGeneratedEntry(sourceId: string, start: string, end: string): Promise<boolean> {
  const row = await getDb().getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM expenses
     WHERE recurring_source_id = ? AND date BETWEEN ? AND ?`,
    sourceId,
    start,
    end,
  );
  return (row?.count ?? 0) > 0;
}

// ---------- Writing ----------

export async function createExpense(
  input: ExpenseInput,
  recurringSourceId: string | null = null,
): Promise<string> {
  const id = newId();
  const now = nowTimestamp();
  await getDb().runAsync(
    `INSERT INTO expenses
      (id, amount, category_id, date, note, is_recurring, recurring_day, recurring_source_id,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.amount,
    input.categoryId,
    input.date,
    input.note.trim(),
    input.isRecurring ? 1 : 0,
    input.isRecurring ? input.recurringDay : null,
    recurringSourceId,
    now,
    now,
  );
  return id;
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<void> {
  await getDb().runAsync(
    `UPDATE expenses
     SET amount = ?, category_id = ?, date = ?, note = ?, is_recurring = ?, recurring_day = ?, updated_at = ?
     WHERE id = ?`,
    input.amount,
    input.categoryId,
    input.date,
    input.note.trim(),
    input.isRecurring ? 1 : 0,
    input.isRecurring ? input.recurringDay : null,
    nowTimestamp(),
    id,
  );
}

/** Stops a recurring template from creating new monthly entries. */
export async function stopRecurring(id: string): Promise<void> {
  await getDb().runAsync(
    'UPDATE expenses SET is_recurring = 0, recurring_day = NULL, updated_at = ? WHERE id = ?',
    nowTimestamp(),
    id,
  );
}

/** Soft delete: the row is hidden everywhere but kept so the deletion can sync. */
export async function deleteExpense(id: string): Promise<void> {
  const now = nowTimestamp();
  await getDb().runAsync('UPDATE expenses SET deleted_at = ?, updated_at = ? WHERE id = ?', now, now, id);
}

/** Removes ALL local data and re-creates the default categories. */
export async function clearAllLocalData(): Promise<void> {
  const db = getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM expenses');
    await db.runAsync('DELETE FROM categories');
    await seedDefaultCategories(db);
  });
}

// ---------- Sync helpers ----------

export async function getDirtyExpenses(): Promise<ExpenseRow[]> {
  return getDb().getAllAsync<ExpenseRow>(
    'SELECT * FROM expenses WHERE synced_at IS NULL OR updated_at > synced_at',
  );
}

export async function markExpenseSynced(id: string, updatedAt: string): Promise<void> {
  await getDb().runAsync(
    'UPDATE expenses SET synced_at = updated_at WHERE id = ? AND updated_at = ?',
    id,
    updatedAt,
  );
}

export async function getExpenseUpdatedAt(id: string): Promise<string | null> {
  const row = await getDb().getFirstAsync<{ updated_at: string }>(
    'SELECT updated_at FROM expenses WHERE id = ?',
    id,
  );
  return row?.updated_at ?? null;
}

export async function upsertExpenseFromRemote(row: Omit<ExpenseRow, 'synced_at'>): Promise<void> {
  await getDb().runAsync(
    `INSERT OR REPLACE INTO expenses
      (id, amount, category_id, date, note, is_recurring, recurring_day, recurring_source_id,
       created_at, updated_at, synced_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    row.id,
    row.amount,
    row.category_id,
    row.date,
    row.note,
    row.is_recurring,
    row.recurring_day,
    row.recurring_source_id,
    row.created_at,
    row.updated_at,
    row.updated_at,
    row.deleted_at,
  );
}
