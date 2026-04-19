"use client";

import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { Player, Team } from "@/types/game";
import styles from "./TurnIndicator.module.css";

interface TurnIndicatorProps {
  team: Team;
  describer: Player | undefined;
  role: "describer" | "guesser" | "opponent";
}

export function TurnIndicator({ team, describer, role }: TurnIndicatorProps) {
  const t = useTranslations("game");
  const tLobby = useTranslations("lobby");
  return (
    <div className={styles.wrap}>
      <Badge variant={team === "A" ? "team-a" : "team-b"}>
        {t("turnOf", { team: team === "A" ? tLobby("teamA") : tLobby("teamB") })}
      </Badge>
      {describer && (
        <div className={styles.describer}>
          <Avatar avatarId={describer.avatarId} size="sm" team={team} />
          <div className={styles.describerText}>
            <div className={styles.describerName}>{describer.username}</div>
            <div className={styles.role}>
              {role === "describer" && t("yourTurnToast")}
              {role === "guesser" && t("guessPrompt")}
              {role === "opponent" && t("opponentPrompt")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
