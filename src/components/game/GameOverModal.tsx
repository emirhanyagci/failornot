"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Team, TeamStats } from "@/types/game";
import { cn } from "@/lib/utils";

interface GameOverModalProps {
  open: boolean;
  winner?: Team | "draw";
  teams: Record<Team, TeamStats>;
  isHost: boolean;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export function GameOverModal({
  open,
  winner,
  teams,
  isHost,
  onPlayAgain,
  onBackToLobby,
}: GameOverModalProps) {
  const t = useTranslations("gameOver");

  const title =
    winner === "A"
      ? t("winnerA")
      : winner === "B"
        ? t("winnerB")
        : winner === "draw"
          ? t("draw")
          : t("title");

  return (
    <Modal open={open} hideCloseButton>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-6xl" aria-hidden="true">
          🏆
        </div>
        <h2 className="font-head text-2xl uppercase">{title}</h2>
        <div className="flex flex-col gap-2 w-full">
          <ScoreRow team="A" stats={teams.A} winner={winner === "A"} />
          <ScoreRow team="B" stats={teams.B} winner={winner === "B"} />
        </div>
        <div className="flex flex-col gap-2 w-full mt-1">
          {isHost ? (
            <>
              <Button variant="primary" fullWidth onClick={onPlayAgain}>
                {t("playAgain")}
              </Button>
              <Button variant="ghost" fullWidth onClick={onBackToLobby}>
                {t("backToLobby")}
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Lobi sahibi karar veriyor...</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ScoreRow({
  team,
  stats,
  winner,
}: {
  team: Team;
  stats: TeamStats;
  winner: boolean;
}) {
  const teamColor = team === "A" ? "border-team-a" : "border-team-b";
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 border-2 rounded bg-card",
        teamColor,
        winner && "bg-accent shadow-md",
      )}
    >
      <span className="font-head">Takım {team}</span>
      <span className="font-mono text-2xl font-bold">{stats.score}</span>
    </div>
  );
}
