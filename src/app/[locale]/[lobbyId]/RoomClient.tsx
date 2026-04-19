"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRoomConnection } from "@/features/game-engine/useRoomConnection";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useRouter } from "@/lib/i18n/routing";
import { LobbyWaitingRoom } from "./LobbyWaitingRoom";
import { GameView } from "./GameView";
import type { LobbySettings } from "@/types/game";

interface RoomClientProps {
  lobbyId: string;
}

export function RoomClient({ lobbyId }: RoomClientProps) {
  const tCommon = useTranslations("common");
  const router = useRouter();
  const username = usePlayerStore((s) => s.username);

  const room = useRoomConnection({ roomId: lobbyId, autoJoin: true });

  // If the user created this lobby, push the settings once they're in
  const hostedSettings = useMemo<LobbySettings | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(`faulornot.settings.${lobbyId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LobbySettings;
    } catch {
      return null;
    }
  }, [lobbyId]);

  useEffect(() => {
    if (!username) {
      toast.error("Önce kullanıcı adı gir");
      router.push("/");
    }
  }, [username, router]);

  useEffect(() => {
    if (!room.lobby || !hostedSettings) return;
    if (room.meId !== room.lobby.hostId) return;
    // push the hosted settings once
    const key = `faulornot.settings.${lobbyId}.pushed`;
    if (sessionStorage.getItem(key)) return;
    room.send({ type: "update_settings", payload: hostedSettings });
    sessionStorage.setItem(key, "1");
  }, [room, hostedSettings, lobbyId]);

  if (!room.connected && !room.lobby && !room.game) {
    return (
      <motion.div
        className="page-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ alignItems: "center", justifyContent: "center", minHeight: "60vh" }}
      >
        <div className="text-secondary">{tCommon("connecting")}</div>
      </motion.div>
    );
  }

  if (room.game) {
    return <GameView room={room} lobbyId={lobbyId} />;
  }

  if (room.lobby) {
    return <LobbyWaitingRoom room={room} lobbyId={lobbyId} />;
  }

  return null;
}
