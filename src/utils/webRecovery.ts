/**
 * Only needed on web (see webRecovery.web.ts). On phones there is nothing to
 * recover, so this always returns false.
 */
export function reloadIfDatabaseLocked(_error: unknown): boolean {
  return false;
}

/** Marks a successful start (web only). */
export function markStartupSucceeded(): void {}
