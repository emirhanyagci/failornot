"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Team, TeamStats } from "@/types/game";
import styles from "./GameOverModal.module.css";

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
      <motion.div
        className={styles.content}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 260 }}
      >
        <div className={styles.trophy}>🏆</div>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.scores}>
          <ScoreRow team="A" stats={teams.A} winner={winner === "A"} />
          <ScoreRow team="B" stats={teams.B} winner={winner === "B"} />
        </div>
        <div className={styles.actions}>
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
            <p className={styles.waitingText}>Lobi sahibi karar veriyor...</p>
          )}
        </div>
      </motion.div>
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
  return (
    <div className={`${styles.row} ${styles[`team${team}`]} ${winner ? styles.winnerRow : ""}`}>
      <span className={styles.rowTeam}>Takım {team}</span>
      <span className={styles.rowScore}>{stats.score}</span>
    </div>
  );
}
