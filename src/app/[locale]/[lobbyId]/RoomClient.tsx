"use client";

import { useEffect, useMemo } from "react";
import { Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRoomConnection } from "@/features/game-engine/useRoomConnection";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useRouter } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/retroui/Card";
import { LobbyWaitingRoom } from "./LobbyWaitingRoom";
import { GameView } from "./GameView";
import type { LobbySettings } from "@/types/game";

interface RoomClientProps {
  lobbyId: string;
}

export function RoomClient({ lobbyId }: RoomClientProps) {
  const tCommon = useTranslations("common");
  const tInvite = useTranslations("invite");
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

  if (room.lastError && !room.lobby && !room.game) {
    const errorLabel = errorMessageFor(room.lastError.code, tInvite);
    return (
      <div className="w-full max-w-md flex flex-col gap-4 items-center py-10">
        <Card className="w-full">
          <Card.Content className="text-center flex flex-col gap-2">
            <p className="font-head text-xl uppercase">{errorLabel}</p>
            <p className="text-sm text-muted-foreground">{tInvite("code", { code: lobbyId })}</p>
          </Card.Content>
        </Card>
        <Button
          variant="primary"
          icon={<Home size={18} />}
          onClick={() => router.push("/")}
          fullWidth
        >
          {tInvite("backHome")}
        </Button>
      </div>
    );
  }

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

function errorMessageFor(code: string, t: (key: string) => string): string {
  switch (code) {
    case "LOBBY_FULL":
      return t("errors.lobbyFull");
    case "GAME_IN_PROGRESS":
      return t("errors.gameInProgress");
    case "NOT_FOUND":
      return t("errors.notFound");
    default:
      return t("errors.generic");
  }
}
