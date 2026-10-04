import {
  type CategoryRow,
  getCategoryUpdatedAt,
  getDirtyCategories,
  markCategorySynced,
  upsertCategoryFromRemote,
} from '@/db/categories';
import {
  type ExpenseRow,
  getDirtyExpenses,
  getExpenseUpdatedAt,
  markExpenseSynced,
  upsertExpenseFromRemote,
} from '@/db/expenses';
import { notifyDataChanged } from '@/store/data';
import { useSyncStore } from '@/store/sync';
import { Storage } from '@/utils/storage';

import { supabase } from './supabase';

/**
 * Offline-first sync with Supabase.
 *
 * - Every change is saved to SQLite first, so the app always works offline.
 * - A row is "dirty" when it changed after its last upload (updated_at > synced_at).
 * - PUSH: upload dirty rows (upsert), then mark them synced.
 * - PULL: download rows the server received since our last pull
 *   (tracked with the server-side `server_updated_at` column) and keep
 *   whichever version has the newest `updated_at` ("last write wins").
 * - Deletes are "soft" (deleted_at is set) so they sync like any other change.
 */

const PAGE_SIZE = 500;
const lastPullKey = (userId: string) => `sync:lastPull:${userId}`;

type Remote<T> = Omit<T, 'synced_at'> & { user_id: string; server_updated_at: string };

let running: Promise<void> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Returns the signed-in user's id, or null (not configured / signed out). */
async function getUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Runs a full push + pull. Safe to call often: parallel calls share one run. */
export function syncNow(): Promise<void> {
  if (!running) {
    running = doSync().finally(() => {
      running = null;
    });
  }
  return running;
}

/** Schedules a sync a couple of seconds after the last local change. */
export function scheduleSync(): void {
  if (!supabase) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    syncNow().catch(() => {
      // Errors are stored in the sync store and shown in Settings.
    });
  }, 2000);
}

/** Forgets the pull position so the next sync downloads everything again. */
export function resetSyncState(userId: string): void {
  Storage.removeItemSync(lastPullKey(userId));
}

async function doSync(): Promise<void> {
  const userId = await getUserId();
  if (!supabase || !userId) return;

  const status = useSyncStore.getState();
  status.setSyncing(true);
  try {
    await pushTable<CategoryRow>('categories', userId, getDirtyCategories, markCategorySynced);
    await pushTable<ExpenseRow>('expenses', userId, getDirtyExpenses, markExpenseSynced);

    const lastPull = Storage.getItemSync(lastPullKey(userId));
    const catResult = await pullTable<CategoryRow>(
      'categories',
      userId,
      lastPull,
      getCategoryUpdatedAt,
      upsertCategoryFromRemote,
    );
    const expResult = await pullTable<ExpenseRow>(
      'expenses',
      userId,
      lastPull,
      getExpenseUpdatedAt,
      upsertExpenseFromRemote,
    );

    const newest = [catResult.maxServerTime, expResult.maxServerTime, lastPull]
      .filter((v): v is string => Boolean(v))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    if (newest) Storage.setItemSync(lastPullKey(userId), newest);

    if (catResult.applied + expResult.applied > 0) notifyDataChanged();
    status.setResult({ lastSyncedAt: new Date().toISOString(), error: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed';
    status.setResult({ error: message });
    throw e;
  } finally {
    status.setSyncing(false);
  }
}

/** Uploads all dirty rows of one table. */
async function pushTable<T extends { id: string; updated_at: string; synced_at: string | null }>(
  table: 'categories' | 'expenses',
  userId: string,
  getDirty: () => Promise<T[]>,
  markSynced: (id: string, updatedAt: string) => Promise<void>,
): Promise<void> {
  const dirty = await getDirty();
  if (!supabase || dirty.length === 0) return;

  for (let i = 0; i < dirty.length; i += PAGE_SIZE) {
    const chunk = dirty.slice(i, i + PAGE_SIZE);
    // Remove the local-only synced_at column and attach the owner.
    const payload = chunk.map(({ synced_at: _ignored, ...rest }) => ({ ...rest, user_id: userId }));
    const { error } = await supabase.from(table).upsert(payload, { onConflict: 'user_id,id' });
    if (error) throw new Error(`Upload ${table} failed: ${error.message}`);
    for (const row of chunk) {
      await markSynced(row.id, row.updated_at);
    }
  }
}

/** Downloads rows changed on the server since `lastPull` and applies newer ones. */
async function pullTable<T extends { id: string; updated_at: string }>(
  table: 'categories' | 'expenses',
  userId: string,
  lastPull: string | null,
  getLocalUpdatedAt: (id: string) => Promise<string | null>,
  upsertLocal: (row: Omit<T, 'synced_at'>) => Promise<void>,
): Promise<{ applied: number; maxServerTime: string | null }> {
  if (!supabase) return { applied: 0, maxServerTime: null };

  let applied = 0;
  let maxServerTime: string | null = null;
  let from = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order('server_updated_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (lastPull) query = query.gt('server_updated_at', lastPull);

    const { data, error } = await query;
    if (error) throw new Error(`Download ${table} failed: ${error.message}`);
    const rows = (data ?? []) as Remote<T>[];

    for (const remote of rows) {
      const { user_id: _u, server_updated_at, ...row } = remote;
      maxServerTime = server_updated_at;
      const localUpdatedAt = await getLocalUpdatedAt(row.id);
      // Last write wins: only overwrite if the cloud version is newer.
      if (!localUpdatedAt || new Date(row.updated_at) > new Date(localUpdatedAt)) {
        await upsertLocal(row as unknown as Omit<T, 'synced_at'>);
        applied++;
      }
    }

    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return { applied, maxServerTime };
}

/** Deletes all of the signed-in user's cloud data (used by "Clear all data"). */
export async function deleteAllCloudData(): Promise<void> {
  const userId = await getUserId();
  if (!supabase || !userId) return;
  const e1 = await supabase.from('expenses').delete().eq('user_id', userId);
  if (e1.error) throw new Error(e1.error.message);
  const e2 = await supabase.from('categories').delete().eq('user_id', userId);
  if (e2.error) throw new Error(e2.error.message);
  resetSyncState(userId);
}
