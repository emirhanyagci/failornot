"use client";

import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/retroui/Card";
import type { Player, Team } from "@/types/game";

interface TurnIndicatorProps {
  team: Team;
  describer: Player | undefined;
  role: "describer" | "guesser" | "opponent";
}

export function TurnIndicator({ team, describer, role }: TurnIndicatorProps) {
  const t = useTranslations("game");
  const tLobby = useTranslations("lobby");
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <Badge variant={team === "A" ? "team-a" : "team-b"}>
        {t("turnOf", { team: team === "A" ? tLobby("teamA") : tLobby("teamB") })}
      </Badge>
      {describer && (
        <Card className="w-full">
          <Card.Content className="flex items-center gap-3 p-3">
            <Avatar avatarId={describer.avatarId} size="sm" team={team} />
            <div className="flex flex-col">
              <div className="font-head">{describer.username}</div>
              <div className="text-xs text-muted-foreground">
                {role === "describer" && t("yourTurnToast")}
                {role === "guesser" && t("guessPrompt")}
                {role === "opponent" && t("opponentPrompt")}
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
