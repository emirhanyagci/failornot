"use client";

import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";
import styles from "./Avatar.module.css";
import { cls } from "@/lib/utils";

interface AvatarProps {
  avatarId: string;
  size?: "sm" | "md" | "lg";
  team?: "A" | "B" | null;
  ring?: boolean;
}

export function Avatar({ avatarId, size = "md", team, ring }: AvatarProps) {
  const dataUri = useMemo(
    () =>
      createAvatar(adventurer, {
        seed: avatarId,
        radius: 50,
        backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"],
      }).toDataUri(),
    [avatarId],
  );

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
      <img src={dataUri} alt="" className={styles.image} draggable={false} />
    </div>
  );
}
