"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AVATAR_IDS, generateSecret } from "@/lib/utils";

interface PlayerState {
  username: string;
  avatarId: string;
  secret: string;
  setUsername: (username: string) => void;
  setAvatarId: (avatarId: string) => void;
  cycleAvatar: (dir: 1 | -1) => void;
  ensureSecret: () => string;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      username: "",
      avatarId: AVATAR_IDS[0],
      secret: "",
      setUsername: (username) => set({ username: username.slice(0, 16) }),
      setAvatarId: (avatarId) => set({ avatarId }),
      cycleAvatar: (dir) => {
        const idx = AVATAR_IDS.indexOf(get().avatarId);
        const next = (idx + dir + AVATAR_IDS.length) % AVATAR_IDS.length;
        set({ avatarId: AVATAR_IDS[next] });
      },
      ensureSecret: () => {
        const s = get().secret;
        if (s) return s;
        const next = generateSecret();
        set({ secret: next });
        return next;
      },
    }),
    {
      name: "faulornot.player",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
