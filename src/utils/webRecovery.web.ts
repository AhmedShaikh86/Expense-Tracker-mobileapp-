/**
 * In the browser, the database file stays locked for a moment by a page that
 * is still closing (e.g. after pressing F5 quickly) or by another open tab.
 * Opening it then fails, and the SQLite engine in this page can't recover, so
 * the fix is to reload the page once the lock is gone. We try up to 3 times.
 */
const KEY = 'db-lock-reloads';
const MAX_RELOADS = 3;

export function reloadIfDatabaseLocked(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  if (!/Access Handle|NoModificationAllowed|Invalid VFS state/i.test(message)) return false;

  const count = Number(window.sessionStorage.getItem(KEY) ?? '0');
  if (count >= MAX_RELOADS) {
    window.sessionStorage.removeItem(KEY);
    return false; // give up and show the error (probably open in another tab)
  }
  window.sessionStorage.setItem(KEY, String(count + 1));
  setTimeout(() => window.location.reload(), 1000);
  return true;
}

export function markStartupSucceeded(): void {
  window.sessionStorage.removeItem(KEY);
}
