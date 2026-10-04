import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_CURRENCY_CODE } from '@/constants/currencies';
import type { ThemeMode } from '@/types';
import { Storage } from '@/utils/storage';

/**
 * User preferences, saved on the device (SQLite key-value store) so they
 * survive app restarts. `persist` loads them back automatically.
 */
interface SettingsState {
  currencyCode: string;
  themeMode: ThemeMode;
  setCurrency: (code: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currencyCode: DEFAULT_CURRENCY_CODE,
      themeMode: 'system',
      setCurrency: (code) => set({ currencyCode: code }),
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'settings',
      // The kv-store has synchronous methods, so settings are ready on the first render.
      storage: createJSONStorage(() => ({
        getItem: (key) => Storage.getItemSync(key),
        setItem: (key, value) => Storage.setItemSync(key, value),
        removeItem: (key) => {
          Storage.removeItemSync(key);
        },
      })),
    },
  ),
);
