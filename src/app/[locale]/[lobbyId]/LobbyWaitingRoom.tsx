"use client";

import { ArrowLeft, Link2, Play, Shuffle, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { LobbyCodeDisplay } from "@/components/lobby/LobbyCodeDisplay";
import { PlayerList } from "@/components/lobby/PlayerList";
import { Card } from "@/components/retroui/Card";
import { Badge } from "@/components/ui/Badge";
import { useRouter } from "@/lib/i18n/routing";
import type { RoomConnection } from "@/features/game-engine/useRoomConnection";

interface LobbyWaitingRoomProps {
  room: RoomConnection;
  lobbyId: string;
}

export function LobbyWaitingRoom({ room, lobbyId }: LobbyWaitingRoomProps) {
  const t = useTranslations("lobby");
  const tCreate = useTranslations("create");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const { lobby, meId } = room;
  if (!lobby) return null;

  const copyInviteLink = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/${locale}/join/${lobbyId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("inviteCopied"));
    } catch {
      toast.error(t("inviteCopyFailed"));
    }
  };

  const isHost = meId === lobby.hostId;
  const teamA = lobby.players.filter((p) => p.team === "A" && p.status === "connected");
  const teamB = lobby.players.filter((p) => p.team === "B" && p.status === "connected");
  const canStart = isHost && teamA.length >= 1 && teamB.length >= 1;

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="subtle"
          icon={<ArrowLeft size={18} />}
          onClick={() => {
            room.send({ type: "leave" });
            router.push("/");
          }}
        >
          {t("leaveLobby")}
        </Button>
        <Badge variant="neutral">
          {t("playerCount", { count: lobby.players.length, max: lobby.settings.maxPlayers })}
        </Badge>
      </div>

      <div className="flex flex-col items-center gap-3">
        <LobbyCodeDisplay code={lobbyId} label={t("codeLabel")} />
        <Button
          variant="accent"
          size="sm"
          icon={<Link2 size={16} />}
          onClick={copyInviteLink}
        >
          {t("invite")}
        </Button>
        <div className="text-sm text-center text-muted-foreground">
          {tCreate(`modes.${lobby.settings.mode}`)} •{" "}
          {lobby.settings.categorySlugs.map((s) => tCreate(`categories.${s}`)).join(", ")} •{" "}
          {lobby.settings.roundTime}
          {tCommon("seconds")}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-stretch gap-3">
          <PlayerList
            team="A"
            players={lobby.players}
            hostId={lobby.hostId}
            myId={meId}
            isHost={isHost}
            onAssign={(playerId, team) => room.send({ type: "assign_team", payload: { playerId, team } })}
          />
          <PlayerList
            team="B"
            players={lobby.players}
            hostId={lobby.hostId}
            myId={meId}
            isHost={isHost}
            onAssign={(playerId, team) => room.send({ type: "assign_team", payload: { playerId, team } })}
          />
        </div>

        {isHost && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              icon={<Shuffle size={18} />}
              onClick={() => room.send({ type: "shuffle_teams" })}
              fullWidth
            >
              {t("shuffle")}
            </Button>
            <Button
              variant="ghost"
              icon={<RefreshCw size={18} />}
              onClick={() => room.send({ type: "swap_teams" })}
              fullWidth
            >
              {t("swap")}
            </Button>
          </div>
        )}
      </div>

      {isHost ? (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canStart}
          icon={<Play size={20} />}
          onClick={() => room.send({ type: "start_game" })}
        >
          {t("startGame")}
        </Button>
      ) : (
        <Card className="w-full">
          <Card.Content className="text-center text-muted-foreground">
            {t("waitingForHost")}
          </Card.Content>
        </Card>
      )}

      {!canStart && isHost && (
        <p className="text-sm text-center text-muted-foreground">{t("minPlayers")}</p>
      )}
    </div>
  );
}
