"use client";

import { motion } from "framer-motion";
import styles from "./GameTimer.module.css";
import { formatTime, cls } from "@/lib/utils";

interface GameTimerProps {
  seconds: number;
  maxSeconds?: number;
  variant?: "default" | "bomb";
}

export function GameTimer({ seconds, maxSeconds, variant = "default" }: GameTimerProps) {
  const critical = seconds <= 5;
  const warning = seconds <= 10;
  const pct = maxSeconds ? Math.max(0, Math.min(100, (seconds / maxSeconds) * 100)) : null;

  return (
    <div className={cls(styles.wrap, variant === "bomb" && styles.bomb)}>
      <motion.div
        className={cls(
          styles.display,
          warning && styles.warning,
          critical && styles.critical,
        )}
        animate={critical ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={critical ? { duration: 0.6, repeat: Infinity } : { duration: 0.2 }}
      >
        {variant === "bomb" && <span className={styles.bombIcon}>💣</span>}
        <span>{formatTime(seconds)}</span>
      </motion.div>
      {pct !== null && (
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
