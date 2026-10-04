import { router } from 'expo-router';

/**
 * Closes the current screen. If there is no previous screen (e.g. the page
 * was opened directly by URL on web), goes to Home instead of failing.
 */
export function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
