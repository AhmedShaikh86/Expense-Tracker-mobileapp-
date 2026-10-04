import { create } from 'zustand';

/**
 * A tiny "something changed" signal.
 *
 * Whenever expenses or categories change (added, edited, deleted, synced...),
 * we call `bump()`. Screens include `version` in their effect dependencies,
 * so they reload their data automatically.
 */
interface DataState {
  version: number;
  bump: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));

/** Call from anywhere (including non-React code) to refresh all screens. */
export function notifyDataChanged(): void {
  useDataStore.getState().bump();
}
