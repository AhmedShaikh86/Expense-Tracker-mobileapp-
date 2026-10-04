/**
 * Makes the page "cross-origin isolated" so expo-sqlite can run in the browser.
 *
 * The first time, it installs public/coi-serviceworker.js (which adds the
 * required headers) and reloads the page once. After that the page is
 * isolated and this returns immediately.
 */
const RELOAD_FLAG = 'coi-reloaded';

export async function ensureCrossOriginIsolated(): Promise<void> {
  if (window.crossOriginIsolated) {
    window.sessionStorage.removeItem(RELOAD_FLAG);
    return;
  }
  if (!('serviceWorker' in navigator)) {
    throw new Error('This browser cannot run the local database. Please use Chrome or Edge.');
  }
  if (window.sessionStorage.getItem(RELOAD_FLAG)) {
    // We already reloaded once and it still isn't isolated: stop instead of looping.
    window.sessionStorage.removeItem(RELOAD_FLAG);
    throw new Error('Could not enable the local database in this browser. Try reloading the page.');
  }

  await navigator.serviceWorker.register('/coi-serviceworker.js');
  await navigator.serviceWorker.ready;
  window.sessionStorage.setItem(RELOAD_FLAG, '1');
  window.location.reload();
  // Wait forever: the page is reloading.
  await new Promise(() => {});
}
