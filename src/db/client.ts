import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrations';

/**
 * Single shared SQLite connection for the whole app.
 * Every file in db/ calls getDb() instead of opening its own connection.
 */

const DATABASE_NAME = 'expense-tracker.db';

let db: SQLite.SQLiteDatabase | null = null;

/** Returns the open database. initDatabase() must have finished first (it runs at app startup). */
export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database is not ready yet. initDatabase() must run first.');
  }
  return db;
}

/** Opens the database and brings the schema up to date. Call once at startup. */
export async function initDatabase(): Promise<void> {
  // Opened asynchronously: required on web, where the SQLite engine loads in the background.
  if (!db) {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await runMigrations(db);
}
