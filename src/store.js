import { create } from 'zustand';

export const useStore = create((set) => ({
  // hub overlay already passed (gates the persistent nav on the hub)
  explored: false,
  setExplored: (v) => set({ explored: v }),

  menuOpen: false,
  setMenuOpen: (v) => set({ menuOpen: v }),

  muted: false,
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}));
