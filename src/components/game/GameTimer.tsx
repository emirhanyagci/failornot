"use client";

import { formatTime, cn } from "@/lib/utils";

interface GameTimerProps {
  seconds: number;
  maxSeconds?: number;
  variant?: "default" | "bomb";
}

export function GameTimer({ seconds, maxSeconds, variant = "default" }: GameTimerProps) {
  const critical = seconds <= 5;
  const warning = seconds <= 10;
  const pct = maxSeconds ? Math.max(0, Math.min(100, (seconds / maxSeconds) * 100)) : null;

  const colorClass = critical
    ? "bg-destructive text-destructive-foreground"
    : warning
      ? "bg-warning text-warning-foreground"
      : "bg-card text-card-foreground";

  return (
    <div className={cn("flex flex-col items-stretch gap-2 w-full max-w-xs mx-auto", variant === "bomb" && "")}> 
      <div
        className={cn(
          "flex items-center justify-center gap-2 border-2 border-border rounded px-4 py-3 font-mono font-bold text-3xl shadow-md",
          colorClass,
          critical && "animate-pulse",
        )}
      >
        {variant === "bomb" && <span className="text-2xl">💣</span>}
        <span>{formatTime(seconds)}</span>
      </div>
      {pct !== null && (
        <div className="h-3 w-full border-2 border-border bg-card rounded overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              critical ? "bg-destructive" : warning ? "bg-warning" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
