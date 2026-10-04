import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_CATEGORIES } from '@/constants/categories';

/**
 * A very small migration system.
 *
 * SQLite has a built-in integer called `user_version`. We store the schema
 * version there. On startup we run every migration whose version is higher
 * than the stored one, in order, and then save the new version.
 *
 * To change the schema later: add a new object to MIGRATIONS with the next
 * version number. NEVER edit a migration that has already shipped.
 */

interface Migration {
  version: number;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Create categories and expenses tables, seed default categories',
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          monthly_budget INTEGER,
          is_default INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          synced_at TEXT,
          deleted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY NOT NULL,
          amount INTEGER NOT NULL,
          category_id TEXT NOT NULL,
          date TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          is_recurring INTEGER NOT NULL DEFAULT 0,
          recurring_day INTEGER,
          recurring_source_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          synced_at TEXT,
          deleted_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);
        CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category_id);
        CREATE INDEX IF NOT EXISTS idx_expenses_source ON expenses (recurring_source_id);
      `);
      await seedDefaultCategories(db);
    },
  },
  // Example for the future:
  // {
  //   version: 2,
  //   description: 'Add payment_method column',
  //   up: async (db) => {
  //     await db.execAsync("ALTER TABLE expenses ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'");
  //   },
  // },
];

/** Inserts the default categories (skips any that already exist). */
export async function seedDefaultCategories(db: SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();
  for (const c of DEFAULT_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories
        (id, name, icon, color, monthly_budget, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, 1, ?, ?)`,
      c.id,
      c.name,
      c.icon,
      c.color,
      now,
      now,
    );
  }
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) continue;
    // Each migration runs in a transaction: it either fully applies or not at all.
    await db.withTransactionAsync(async () => {
      await migration.up(db);
    });
    // PRAGMA does not support bound parameters; the version is our own integer.
    await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    currentVersion = migration.version;
  }
}
