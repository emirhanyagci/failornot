"use client";

import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";
import { Avatar as RetroAvatar } from "@/components/retroui/Avatar";
import { cn } from "@/lib/utils";

interface AvatarProps {
  avatarId: string;
  size?: "sm" | "md" | "lg";
  team?: "A" | "B" | null;
  ring?: boolean;
}

const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

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
    <RetroAvatar
      aria-label={`avatar-${avatarId}`}
      className={cn(
        "border-2 border-border bg-card shrink-0 shadow-xs",
        sizeClasses[size],
        team === "A" && "ring-4 ring-team-a ring-offset-2 ring-offset-background",
        team === "B" && "ring-4 ring-team-b ring-offset-2 ring-offset-background",
        ring && "ring-4 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <RetroAvatar.Image src={dataUri} alt="" draggable={false} />
    </RetroAvatar>
  );
}
