"use client";

import { Crown, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/retroui/Card";
import { cn } from "@/lib/utils";
import type { Player, Team } from "@/types/game";

interface PlayerListProps {
  team: Team;
  players: Player[];
  hostId: string;
  onAssign?: (playerId: string, team: Team) => void;
  myTeam?: Team | null;
  myId?: string | null;
  isHost?: boolean;
}

export function PlayerList({ team, players, hostId, onAssign, myId, isHost }: PlayerListProps) {
  const t = useTranslations("lobby");
  const teamPlayers = players.filter((p) => p.team === team);
  const teamColor = team === "A" ? "bg-team-a text-team-a-foreground" : "bg-team-b text-team-b-foreground";

  return (
    <Card className="flex-1 min-w-[180px]">
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 border-b-2 border-border font-head",
          teamColor,
        )}
      >
        <span>{team === "A" ? t("teamA") : t("teamB")}</span>
        <span className="font-mono">{teamPlayers.length}</span>
      </div>
      <Card.Content className="flex flex-col gap-2 p-3">
        {teamPlayers.map((p) => (
          <div
            key={p.id}
            className={cn(
              "flex items-center gap-2 p-2 border-2 border-border rounded bg-card",
              p.id === myId && "shadow-xs",
              p.status === "disconnected" && "opacity-50",
            )}
          >
            <Avatar avatarId={p.avatarId} size="sm" team={team} />
            <span className="flex-1 font-head text-sm truncate">{p.username}</span>
            {p.id === hostId && <Crown size={14} className="text-primary" />}
            {p.status === "disconnected" && <WifiOff size={14} className="text-muted-foreground" />}
            {isHost && onAssign && p.id !== myId && (
              <button
                type="button"
                className="border-2 border-border bg-card px-1.5 py-0.5 rounded font-head text-xs hover:bg-accent transition-colors"
                onClick={() => onAssign(p.id, team === "A" ? "B" : "A")}
                aria-label="Takım değiştir"
              >
                ⇄
              </button>
            )}
          </div>
        ))}
        {teamPlayers.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-3 font-head italic">
            {t("emptySlot")}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
