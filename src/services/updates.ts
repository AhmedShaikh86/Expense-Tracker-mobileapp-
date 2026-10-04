import * as Updates from 'expo-updates';

/**
 * Over-the-air updates (EAS Update).
 *
 * When you publish new code with `npm run update`, the installed app
 * downloads it here at startup and restarts itself, so the change is visible
 * right away. With no internet (or a slow connection) we give up after a few
 * seconds and the app opens normally; the update is then used next time.
 *
 * Does nothing in Expo Go, in development, or on web.
 */
const TIMEOUT_MS = 5000;

export async function applyUpdateIfAvailable(): Promise<void> {
  if (!Updates.isEnabled || __DEV__) return;

  const timeout = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), TIMEOUT_MS));
  const download = (async () => {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return false;
    const result = await Updates.fetchUpdateAsync();
    return result.isNew;
  })();

  try {
    const outcome = await Promise.race([download, timeout]);
    if (outcome === true) {
      // Restart the app with the new code.
      await Updates.reloadAsync();
    }
  } catch {
    // Never block the app because of an update problem.
  }
}
