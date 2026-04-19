"use client";

import { create } from "zustand";

interface UIState {
  soundEnabled: boolean;
  toggleSound: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  soundEnabled: true,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
}));
