// Gives `globalThis.localStorage` (backed by SQLite) so Supabase can remember the login.
import 'expo-sqlite/localStorage/install';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState } from 'react-native';

/**
 * Supabase client — or `null` when the keys are not configured.
 * Always check `isSupabaseConfigured` (or `supabase !== null`) before using it.
 */

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const url = extra.supabaseUrl?.trim() ?? '';
const anonKey = extra.supabaseAnonKey?.trim() ?? '';

/** True only when real-looking keys are present in .env. */
export const isSupabaseConfigured =
  url.startsWith('https://') && anonKey.length > 20 && !url.includes('your-project');

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Refresh the login token only while the app is in the foreground (recommended by Supabase).
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
