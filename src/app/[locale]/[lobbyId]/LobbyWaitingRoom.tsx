"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Play, Shuffle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { LobbyCodeDisplay } from "@/components/lobby/LobbyCodeDisplay";
import { PlayerList } from "@/components/lobby/PlayerList";
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
  const router = useRouter();

  const { lobby, meId } = room;
  if (!lobby) return null;

  const isHost = meId === lobby.hostId;
  const teamA = lobby.players.filter((p) => p.team === "A" && p.status === "connected");
  const teamB = lobby.players.filter((p) => p.team === "B" && p.status === "connected");
  const canStart = isHost && teamA.length >= 1 && teamB.length >= 1;

  return (
    <motion.div
      className="page-container page-wide"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
        <span className="pill">
          {t("playerCount", { count: lobby.players.length, max: lobby.settings.maxPlayers })}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-md)" }}>
        <LobbyCodeDisplay code={lobbyId} label={t("codeLabel")} />
        <div className="text-secondary" style={{ fontSize: "0.85rem", textAlign: "center" }}>
          {tCreate(`modes.${lobby.settings.mode}`)} •{" "}
          {lobby.settings.categorySlugs.map((s) => tCreate(`categories.${s}`)).join(", ")} •{" "}
          {lobby.settings.roundTime}
          {tCommon("seconds")}
        </div>
      </div>

      <div className="stack">
        <div className="row" style={{ alignItems: "stretch", flexWrap: "wrap" }}>
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
          <div className="row">
            <Button variant="ghost" icon={<Shuffle size={18} />} onClick={() => room.send({ type: "shuffle_teams" })} fullWidth>
              {t("shuffle")}
            </Button>
            <Button variant="ghost" icon={<RefreshCw size={18} />} onClick={() => room.send({ type: "swap_teams" })} fullWidth>
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
        <div className="glass-card" style={{ textAlign: "center" }}>
          <span className="text-secondary">{t("waitingForHost")}</span>
        </div>
      )}

      {!canStart && isHost && (
        <p className="text-muted" style={{ fontSize: "0.85rem", textAlign: "center" }}>
          {t("minPlayers")}
        </p>
      )}
    </motion.div>
  );
}
