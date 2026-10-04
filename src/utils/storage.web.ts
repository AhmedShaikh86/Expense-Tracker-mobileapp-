/** Web version of storage.ts, backed by the browser's localStorage. */
export const Storage = {
  getItemSync: (key: string): string | null => window.localStorage.getItem(key),
  setItemSync: (key: string, value: string): void => window.localStorage.setItem(key, value),
  removeItemSync: (key: string): void => window.localStorage.removeItem(key),
};
