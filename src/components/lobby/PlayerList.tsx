"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import type { Player, Team } from "@/types/game";
import styles from "./PlayerList.module.css";

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

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.label}>
          {team === "A" ? t("teamA") : t("teamB")}
        </span>
        <span className={styles.count}>{teamPlayers.length}</span>
      </div>
      <div className={styles.list}>
        <AnimatePresence initial={false}>
          {teamPlayers.map((p) => (
            <motion.div
              key={p.id}
              className={`${styles.player} ${p.id === myId ? styles.me : ""} ${p.status === "disconnected" ? styles.offline : ""}`}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
            >
              <Avatar avatarId={p.avatarId} size="sm" team={team} />
              <span className={styles.name}>{p.username}</span>
              {p.id === hostId && <Crown size={14} className={styles.hostIcon} />}
              {p.status === "disconnected" && <WifiOff size={14} className={styles.offlineIcon} />}
              {isHost && onAssign && p.id !== myId && (
                <button
                  className={styles.swapBtn}
                  onClick={() => onAssign(p.id, team === "A" ? "B" : "A")}
                  aria-label="Takım değiştir"
                >
                  ⇄
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {teamPlayers.length === 0 && (
          <div className={styles.empty}>{t("emptySlot")}</div>
        )}
      </div>
    </div>
  );
}
