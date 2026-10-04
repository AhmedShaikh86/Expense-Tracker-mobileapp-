import KVStore from 'expo-sqlite/kv-store';

/**
 * Small synchronous key-value storage for settings and sync bookkeeping.
 * On phones it is backed by SQLite (expo-sqlite/kv-store); on web the
 * `storage.web.ts` version uses the browser's localStorage.
 */
export const Storage = {
  getItemSync: (key: string): string | null => KVStore.getItemSync(key),
  setItemSync: (key: string, value: string): void => KVStore.setItemSync(key, value),
  removeItemSync: (key: string): void => {
    KVStore.removeItemSync(key);
  },
};
