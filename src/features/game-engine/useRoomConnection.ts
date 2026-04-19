"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";
import { toast } from "sonner";
import { getPartyHost } from "@/lib/partykit/config";
import { usePlayerStore } from "@/stores/usePlayerStore";
import type { ClientMessage, ServerMessage } from "@/types/messages";
import type {
  GameState,
  LobbyState,
  RoundEvent,
  Team,
  WordCard,
} from "@/types/game";

interface UseRoomConnectionOptions {
  roomId: string;
  autoJoin?: boolean;
}

export interface RoomConnection {
  connected: boolean;
  lobby: LobbyState | null;
  game: GameState | null;
  meId: string | null;
  revealedWord: WordCard | null;
  lastTimer: number | null;
  bomb: { holder: Team; remaining: number } | null;
  send: (msg: ClientMessage) => void;
}

export function useRoomConnection({ roomId, autoJoin = true }: UseRoomConnectionOptions): RoomConnection {
  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [revealedWord, setRevealedWord] = useState<WordCard | null>(null);
  const [lastTimer, setLastTimer] = useState<number | null>(null);
  const [bomb, setBomb] = useState<{ holder: Team; remaining: number } | null>(null);
  const socketRef = useRef<PartySocket | null>(null);

  const username = usePlayerStore((s) => s.username);
  const avatarId = usePlayerStore((s) => s.avatarId);
  const ensureSecret = usePlayerStore((s) => s.ensureSecret);

  useEffect(() => {
    if (!roomId) return;
    const socket = new PartySocket({
      host: getPartyHost(),
      room: roomId,
    });
    socketRef.current = socket;

    const handleOpen = () => {
      setConnected(true);
      const secret = ensureSecret();
      if (autoJoin && username) {
        const joinMsg: ClientMessage = {
          type: "join",
          payload: { username, avatarId, secret },
        };
        socket.send(JSON.stringify(joinMsg));
      } else if (secret) {
        const rejoin: ClientMessage = { type: "rejoin", payload: { secret } };
        socket.send(JSON.stringify(rejoin));
      }
    };

    const handleMessage = (evt: MessageEvent) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(evt.data as string) as ServerMessage;
      } catch {
        return;
      }
      switch (msg.type) {
        case "you_are":
          setMeId(msg.payload.playerId);
          break;
        case "lobby_state":
          setLobby(msg.payload);
          setGame(null);
          setRevealedWord(null);
          setBomb(null);
          break;
        case "game_state":
          setGame(msg.payload);
          setLobby(null);
          break;
        case "word_reveal":
          setRevealedWord(msg.payload);
          break;
        case "timer_tick":
          setLastTimer(msg.payload.remaining);
          setGame((g) => (g ? { ...g, timer: msg.payload.remaining } : g));
          break;
        case "bomb_tick":
          setBomb({ holder: msg.payload.holder, remaining: msg.payload.remaining });
          setGame((g) =>
            g ? { ...g, bombHolder: msg.payload.holder, bombRemaining: msg.payload.remaining } : g,
          );
          break;
        case "round_event":
          handleRoundEventToast(msg.payload);
          break;
        case "turn_end":
          // optional toast
          break;
        case "game_over":
          // game_state also updates; modal handles it
          break;
        case "error":
          toast.error(msg.payload.message);
          break;
        case "player_joined":
          toast.success(`${msg.payload.username} katıldı`);
          break;
        case "player_left":
          toast(`${msg.payload.username} ayrıldı`);
          break;
        case "host_changed":
          toast(`Yeni lobi sahibi: ${msg.payload.newHostName}`);
          break;
      }
    };

    const handleClose = () => {
      setConnected(false);
    };

    const handleError = () => {
      toast.error("Bağlantı hatası");
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);
    socket.addEventListener("error", handleError);

    return () => {
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("close", handleClose);
      socket.removeEventListener("error", handleError);
      socket.close();
    };
  }, [roomId, autoJoin, username, avatarId, ensureSecret]);

  const send = useCallback((msg: ClientMessage) => {
    const s = socketRef.current;
    if (!s) return;
    s.send(JSON.stringify(msg));
  }, []);

  return { connected, lobby, game, meId, revealedWord, lastTimer, bomb, send };
}

function handleRoundEventToast(evt: RoundEvent) {
  if (evt.type === "correct") toast.success(`Doğru! ✓ ${evt.word}`);
  if (evt.type === "foul") toast.error(`Faul! ✗ ${evt.word}`);
  if (evt.type === "pass") toast(`Pas → ${evt.word}`);
}
