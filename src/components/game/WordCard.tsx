"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { WordCard as WordCardType } from "@/types/game";
import styles from "./WordCard.module.css";

interface WordCardProps {
  card: WordCardType | null;
  hidden?: boolean;
  placeholderText?: string;
  emphasize?: boolean;
}

export function WordCard({ card, hidden, placeholderText, emphasize }: WordCardProps) {
  if (hidden || !card || !card.word) {
    return (
      <div className={`${styles.card} ${styles.hidden}`}>
        <div className={styles.placeholder}>
          <span className={styles.placeholderEmoji}>🤐</span>
          <p className={styles.placeholderText}>
            {placeholderText ?? "Rakip anlatıyor..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key={card.id}
      className={`${styles.card} ${emphasize ? styles.emphasized : ""}`}
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.95 }}
      transition={{ type: "spring", damping: 22, stiffness: 260 }}
    >
      <div className={styles.word}>{card.word}</div>
      <div className={styles.divider} />
      <div className={styles.forbidden}>
        {card.forbidden.map((w) => (
          <div key={w} className={styles.forbiddenItem}>
            <X size={14} />
            <span>{w}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
