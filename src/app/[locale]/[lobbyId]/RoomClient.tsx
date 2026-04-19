"use client";

import { useEffect, useMemo } from "react";
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
    const key = `faulornot.settings.${lobbyId}.pushed`;
    if (sessionStorage.getItem(key)) return;
    room.send({ type: "update_settings", payload: hostedSettings });
    sessionStorage.setItem(key, "1");
  }, [room, hostedSettings, lobbyId]);

  if (!room.connected && !room.lobby && !room.game) {
    return (
      <div className="w-full max-w-md flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground font-head">{tCommon("connecting")}</div>
      </div>
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
