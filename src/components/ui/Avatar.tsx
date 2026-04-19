"use client";

import styles from "./Avatar.module.css";
import { avatarEmoji, cls } from "@/lib/utils";

interface AvatarProps {
  avatarId: string;
  size?: "sm" | "md" | "lg";
  team?: "A" | "B" | null;
  ring?: boolean;
}

export function Avatar({ avatarId, size = "md", team, ring }: AvatarProps) {
  return (
    <div
      className={cls(
        styles.avatar,
        styles[size],
        team === "A" && styles.teamA,
        team === "B" && styles.teamB,
        ring && styles.ring,
      )}
      aria-label={`avatar-${avatarId}`}
    >
      <span className={styles.face}>{avatarEmoji(avatarId)}</span>
    </div>
  );
}
