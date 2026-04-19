"use client";

import type { Team, TeamStats } from "@/types/game";
import { cn } from "@/lib/utils";
import { Card } from "@/components/retroui/Card";

interface ScoreBoardProps {
  teams: Record<Team, TeamStats>;
  currentTeam?: Team | null;
  mode?: "normal" | "sudden_death" | "bomb";
  targetScore?: number;
}

export function ScoreBoard({ teams, currentTeam, mode, targetScore }: ScoreBoardProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 w-full">
      <TeamScore
        team="A"
        label="A"
        stats={teams.A}
        active={currentTeam === "A"}
        mode={mode}
        targetScore={targetScore}
      />
      <div className="flex items-center justify-center font-head text-lg text-muted-foreground px-2">
        VS
      </div>
      <TeamScore
        team="B"
        label="B"
        stats={teams.B}
        active={currentTeam === "B"}
        mode={mode}
        targetScore={targetScore}
      />
    </div>
  );
}

function TeamScore({
  team,
  label,
  stats,
  active,
  mode,
  targetScore,
}: {
  team: Team;
  label: string;
  stats: TeamStats;
  active: boolean;
  mode?: "normal" | "sudden_death" | "bomb";
  targetScore?: number;
}) {
  const teamColor = team === "A" ? "bg-team-a text-team-a-foreground" : "bg-team-b text-team-b-foreground";
  return (
    <Card
      className={cn(
        "w-full text-center transition-all",
        active && "translate-y-[-2px] ring-2 ring-border",
      )}
    >
      <div className={cn("py-1 font-head border-b-2 border-border", teamColor)}>{label}</div>
      <Card.Content className="flex flex-col items-center gap-1 py-3">
        <div className="font-head text-3xl">{stats.score}</div>
        {mode === "bomb" && typeof stats.lives === "number" ? (
          <div className="text-base">{"❤️".repeat(Math.max(0, stats.lives))}</div>
        ) : targetScore ? (
          <div className="text-xs text-muted-foreground font-mono">/ {targetScore}</div>
        ) : null}
      </Card.Content>
    </Card>
  );
}
