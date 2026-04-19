"use client";

import { motion } from "framer-motion";
import type { Team, TeamStats } from "@/types/game";
import styles from "./ScoreBoard.module.css";
import { cls } from "@/lib/utils";

interface ScoreBoardProps {
  teams: Record<Team, TeamStats>;
  currentTeam?: Team | null;
  mode?: "normal" | "sudden_death" | "bomb";
  targetScore?: number;
}

export function ScoreBoard({ teams, currentTeam, mode, targetScore }: ScoreBoardProps) {
  return (
    <div className={styles.board}>
      <TeamScore
        team="A"
        label="A"
        stats={teams.A}
        active={currentTeam === "A"}
        mode={mode}
        targetScore={targetScore}
      />
      <div className={styles.vs}>VS</div>
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
  return (
    <div className={cls(styles.team, styles[`team${team}`], active && styles.active)}>
      <div className={styles.teamLabel}>{label}</div>
      <motion.div
        key={stats.score}
        className={styles.score}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 260 }}
      >
        {stats.score}
      </motion.div>
      {mode === "bomb" && typeof stats.lives === "number" ? (
        <div className={styles.sub}>
          {"❤️".repeat(Math.max(0, stats.lives))}
        </div>
      ) : targetScore ? (
        <div className={styles.sub}>/ {targetScore}</div>
      ) : null}
    </div>
  );
}
