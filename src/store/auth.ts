import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/services/supabase';
import { syncNow } from '@/services/sync';

/**
 * Supabase login state. When Supabase is not configured, `session` simply
 * stays null and the account UI is hidden.
 */
interface AuthState {
  session: Session | null;
  isReady: boolean;
  init: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  /** Returns true when the user must confirm their email before logging in. */
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isReady: false,

  init: () => {
    if (initialized) return;
    initialized = true;
    if (!supabase) {
      set({ isReady: true });
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, isReady: true });
      if (data.session) syncNow().catch(() => {});
    });
    supabase.auth.onAuthStateChange((event, session) => {
      set({ session });
      // Sync right after logging in so cloud data shows up immediately.
      if (event === 'SIGNED_IN') syncNow().catch(() => {});
    });
  },

  signIn: async (email, password) => {
    if (!supabase) throw new Error('Cloud sync is not configured.');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message);
  },

  signUp: async (email, password) => {
    if (!supabase) throw new Error('Cloud sync is not configured.');
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) throw new Error(error.message);
    return { needsConfirmation: !data.session };
  },

  signOut: async () => {
    if (!supabase) return;
    // Upload any pending changes before logging out (ignore failures if offline).
    await syncNow().catch(() => {});
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },
}));
