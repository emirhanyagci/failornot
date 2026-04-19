"use client";

import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionBar } from "@/components/game/ActionBar";
import { GameOverModal } from "@/components/game/GameOverModal";
import { GameTimer } from "@/components/game/GameTimer";
import { RoundEventFlash } from "@/components/game/RoundEventFlash";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { WordCard } from "@/components/game/WordCard";
import { Button } from "@/components/ui/Button";
import type { RoomConnection } from "@/features/game-engine/useRoomConnection";

interface GameViewProps {
  room: RoomConnection;
  lobbyId: string;
}

export function GameView({ room }: GameViewProps) {
  const t = useTranslations("game");
  const { game, meId, revealedWord, bomb, roundEventFlash } = room;
  if (!game) return null;

  const me = game.players.find((p) => p.id === meId);
  const turn = game.turn;
  const describer = turn ? game.players.find((p) => p.id === turn.describerId) : undefined;
  const isDescriber = !!meId && turn?.describerId === meId;
  const myTeam = me?.team ?? null;
  const isMyTeam = !!turn && myTeam === turn.team;
  const role: "describer" | "guesser" | "opponent" = isDescriber
    ? "describer"
    : isMyTeam
      ? "guesser"
      : "opponent";

  const showCardContent = isDescriber || !isMyTeam;
  const card = showCardContent ? revealedWord : null;
  const isHost = meId === game.hostId;
  const isBomb = game.mode === "bomb";

  const timerMax = isBomb ? 30 : game.settings.roundTime;
  const timerValue = isBomb ? (bomb?.remaining ?? game.bombRemaining ?? 0) : game.timer;

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-4 pb-32 sm:pb-8">
      <header className="w-full sticky top-0 z-10 py-2">
        <ScoreBoard
          teams={game.teams}
          currentTeam={turn?.team}
          mode={game.mode}
          targetScore={game.mode === "normal" ? game.settings.targetScore : undefined}
        />
      </header>

      <div className="flex justify-center w-full">
        <GameTimer seconds={timerValue} maxSeconds={timerMax} variant={isBomb ? "bomb" : "default"} />
      </div>

      {turn && describer && (
        <TurnIndicator team={turn.team} describer={describer} role={role} />
      )}

      <div className="relative flex justify-center w-full min-h-[300px]">
        <WordCard
          key={(card?.id ?? "hidden") + String(turn?.team)}
          card={card}
          hidden={!showCardContent}
          placeholderText={
            role === "guesser" ? t("guessPrompt") : role === "opponent" ? t("opponentPrompt") : undefined
          }
          emphasize={isDescriber}
        />
        <RoundEventFlash event={roundEventFlash} />
      </div>

      {turn && (
        <div className="w-full flex flex-col items-center gap-2">
          {isDescriber ? (
            <ActionBar
              onCorrect={() => room.send({ type: "correct" })}
              onPass={() => room.send({ type: "pass" })}
              onFoul={() => room.send({ type: "foul" })}
              passesRemaining={turn.remainingPasses}
              passLimit={game.settings.passLimit}
            />
          ) : role === "opponent" ? (
            <div className="fixed sm:static bottom-0 left-0 right-0 px-4 py-3 sm:p-0 bg-card sm:bg-transparent border-t-2 sm:border-0 border-border z-20 sm:max-w-md sm:mx-auto sm:w-full" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
              <Button
                variant="danger"
                size="lg"
                fullWidth
                icon={<Flag size={20} />}
                onClick={() => room.send({ type: "foul" })}
              >
                {t("callFoul")}
              </Button>
            </div>
          ) : (
            <div className="text-muted-foreground font-head py-4 text-center">
              {t("waitingPrompt")}
            </div>
          )}
        </div>
      )}

      <GameOverModal
        open={game.phase === "game_over"}
        winner={game.winner}
        teams={game.teams}
        isHost={isHost}
        onPlayAgain={() => room.send({ type: "play_again" })}
        onBackToLobby={() => room.send({ type: "return_to_lobby" })}
      />
    </div>
  );
}
