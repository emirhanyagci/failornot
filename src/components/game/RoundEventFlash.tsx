"use client";

import { Check, Flag, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RoundEventFlash as RoundEventFlashState } from "@/features/game-engine/useRoomConnection";
import { cn } from "@/lib/utils";

interface RoundEventFlashProps {
  event: RoundEventFlashState | null;
}

const typeStyles: Record<string, string> = {
  correct: "bg-success text-success-foreground border-border",
  foul: "bg-destructive text-destructive-foreground border-border",
  pass: "bg-warning text-warning-foreground border-border",
};

export function RoundEventFlash({ event }: RoundEventFlashProps) {
  const t = useTranslations("game");

  return (
    <div
      className="absolute -top-3 left-0 right-0 flex justify-center pointer-events-none z-30"
      aria-live="polite"
      aria-atomic
    >
      {event && (
        <div
          key={event.id}
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-3 border-2 rounded font-head text-xs uppercase tracking-wider whitespace-nowrap shadow-md",
            typeStyles[event.data.type],
          )}
        >
          <span className="inline-flex items-center justify-center">
            {event.data.type === "correct" && <Check size={14} strokeWidth={3} />}
            {event.data.type === "foul" && <Flag size={14} strokeWidth={3} />}
            {event.data.type === "pass" && <SkipForward size={14} strokeWidth={3} />}
          </span>
          <span>{t(event.data.type)}</span>
          {event.data.type === "correct" && <span className="font-bold">+1</span>}
          {event.data.type === "foul" && <span className="font-bold">−1</span>}
        </div>
      )}
    </div>
  );
}
