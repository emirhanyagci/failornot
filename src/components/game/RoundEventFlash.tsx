"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Flag, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RoundEventFlash as RoundEventFlashState } from "@/features/game-engine/useRoomConnection";
import styles from "./RoundEventFlash.module.css";

interface RoundEventFlashProps {
  event: RoundEventFlashState | null;
}

export function RoundEventFlash({ event }: RoundEventFlashProps) {
  const t = useTranslations("game");

  return (
    <div className={styles.layer} aria-live="polite" aria-atomic>
      <AnimatePresence>
        {event && (
          <motion.div
            key={event.id}
            className={`${styles.chip} ${styles[event.data.type]}`}
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
          >
            <span className={styles.icon}>
              {event.data.type === "correct" && <Check size={14} strokeWidth={3} />}
              {event.data.type === "foul" && <Flag size={14} strokeWidth={3} />}
              {event.data.type === "pass" && <SkipForward size={14} strokeWidth={3} />}
            </span>
            <span className={styles.label}>{t(event.data.type)}</span>
            {event.data.type === "correct" && <span className={styles.delta}>+1</span>}
            {event.data.type === "foul" && <span className={styles.delta}>−1</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
