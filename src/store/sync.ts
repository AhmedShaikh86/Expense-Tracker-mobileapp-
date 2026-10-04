import { create } from 'zustand';

/** Status of the cloud sync, shown in Settings. */
interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  setSyncing: (value: boolean) => void;
  setResult: (result: { lastSyncedAt?: string; error: string | null }) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
  setSyncing: (value) => set({ isSyncing: value }),
  setResult: ({ lastSyncedAt, error }) =>
    set((s) => ({ error, lastSyncedAt: lastSyncedAt ?? s.lastSyncedAt })),
}));
