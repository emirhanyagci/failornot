"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionBar } from "@/components/game/ActionBar";
import { GameOverModal } from "@/components/game/GameOverModal";
import { GameTimer } from "@/components/game/GameTimer";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { WordCard } from "@/components/game/WordCard";
import { Button } from "@/components/ui/Button";
import { useRouter } from "@/lib/i18n/routing";
import type { RoomConnection } from "@/features/game-engine/useRoomConnection";
import styles from "./GameView.module.css";

interface GameViewProps {
  room: RoomConnection;
  lobbyId: string;
}

export function GameView({ room }: GameViewProps) {
  const t = useTranslations("game");
  const router = useRouter();
  const { game, meId, revealedWord, bomb } = room;
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

  const showCardContent = isDescriber || !isMyTeam; // describer + opponents see word for fouls
  const card = showCardContent ? revealedWord : null;
  const isHost = meId === game.hostId;
  const isBomb = game.mode === "bomb";

  const timerMax = isBomb ? 30 : game.settings.roundTime;
  const timerValue = isBomb ? (bomb?.remaining ?? game.bombRemaining ?? 0) : game.timer;

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className={styles.header}>
        <ScoreBoard
          teams={game.teams}
          currentTeam={turn?.team}
          mode={game.mode}
          targetScore={game.mode === "normal" ? game.settings.targetScore : undefined}
        />
      </header>

      <div className={styles.timerBlock}>
        <GameTimer seconds={timerValue} maxSeconds={timerMax} variant={isBomb ? "bomb" : "default"} />
      </div>

      {turn && describer && (
        <TurnIndicator team={turn.team} describer={describer} role={role} />
      )}

      <div className={styles.cardArea}>
        <AnimatePresence mode="wait">
          <WordCard
            key={(card?.id ?? "hidden") + String(turn?.team)}
            card={card}
            hidden={!showCardContent}
            placeholderText={
              role === "guesser" ? t("guessPrompt") : role === "opponent" ? t("opponentPrompt") : undefined
            }
            emphasize={isDescriber}
          />
        </AnimatePresence>
      </div>

      {turn && (
        <div className={styles.bottomBlock}>
          {isDescriber ? (
            <ActionBar
              onCorrect={() => room.send({ type: "correct" })}
              onPass={() => room.send({ type: "pass" })}
              onFoul={() => room.send({ type: "foul" })}
              passesRemaining={turn.remainingPasses}
              passLimit={game.settings.passLimit}
            />
          ) : role === "opponent" ? (
            <div className={styles.foulBar}>
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
            <div className={styles.waitingText}>{t("waitingPrompt")}</div>
          )}
        </div>
      )}

      <GameOverModal
        open={game.phase === "game_over"}
        winner={game.winner}
        teams={game.teams}
        isHost={isHost}
        onPlayAgain={() => room.send({ type: "play_again" })}
        onBackToLobby={() => {
          room.send({ type: "return_to_lobby" });
          router.push("/");
        }}
      />
    </motion.div>
  );
}
