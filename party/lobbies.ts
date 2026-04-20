import type * as Party from "partykit/server";
import type { GameMode } from "./types";

/**
 * Lobbies registry: singleton party room (id = "index") that tracks all
 * active game lobbies (both public and private) so the browse page can list
 * them. Game rooms POST upsert/remove messages here; clients GET the list.
 */

export interface LobbyRegistryEntry {
  code: string;
  isPublic: boolean;
  mode: GameMode;
  categorySlugs: string[];
  playerCount: number;
  maxPlayers: number;
  hostName: string;
  phase: "lobby" | "countdown" | "playing" | "turn_end" | "game_over";
  updatedAt: number;
}

export interface LobbyListItem {
  /** Opaque id used as React key. For private lobbies this is not the real code. */
  id: string;
  /** Real join code, only exposed for public lobbies. Empty string for private. */
  code: string;
  isPublic: boolean;
  hasPassword: boolean;
  mode: GameMode;
  categorySlugs: string[];
  playerCount: number;
  maxPlayers: number;
  hostName: string;
  updatedAt: number;
}

const STALE_MS = 2 * 60 * 1000;
const STORAGE_KEY = "lobbies";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function hashCode(code: string): string {
  let h = 2166136261;
  for (let i = 0; i < code.length; i++) {
    h ^= code.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).padStart(6, "0").slice(0, 6).toUpperCase();
}

export default class LobbiesRegistry implements Party.Server {
  lobbies = new Map<string, LobbyRegistryEntry>();

  constructor(readonly room: Party.Room) {}

  async onStart() {
    const saved = await this.room.storage.get<Record<string, LobbyRegistryEntry>>(STORAGE_KEY);
    if (saved) {
      for (const [k, v] of Object.entries(saved)) this.lobbies.set(k, v);
    }
  }

  private prune() {
    const now = Date.now();
    for (const [code, entry] of this.lobbies) {
      if (now - entry.updatedAt > STALE_MS) this.lobbies.delete(code);
    }
  }

  private async persist() {
    const obj: Record<string, LobbyRegistryEntry> = {};
    for (const [k, v] of this.lobbies) obj[k] = v;
    await this.room.storage.put(STORAGE_KEY, obj);
  }

  private toListItem(entry: LobbyRegistryEntry): LobbyListItem {
    return {
      id: entry.isPublic ? entry.code : `priv-${hashCode(entry.code)}`,
      code: entry.isPublic ? entry.code : "",
      isPublic: entry.isPublic,
      hasPassword: !entry.isPublic,
      mode: entry.mode,
      categorySlugs: entry.categorySlugs,
      playerCount: entry.playerCount,
      maxPlayers: entry.maxPlayers,
      hostName: entry.hostName,
      updatedAt: entry.updatedAt,
    };
  }

  async onRequest(req: Party.Request) {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (req.method === "GET") {
      this.prune();
      const list = Array.from(this.lobbies.values())
        .filter((e) => e.phase === "lobby")
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((e) => this.toListItem(e));
      return new Response(JSON.stringify({ lobbies: list }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return new Response("Invalid JSON", { status: 400, headers: CORS_HEADERS });
      }

      if (
        body &&
        typeof body === "object" &&
        (body as { type?: string }).type === "upsert" &&
        (body as { entry?: unknown }).entry
      ) {
        const raw = (body as { entry: Partial<LobbyRegistryEntry> }).entry;
        if (!raw.code || typeof raw.code !== "string") {
          return new Response("Missing code", { status: 400, headers: CORS_HEADERS });
        }
        const entry: LobbyRegistryEntry = {
          code: raw.code,
          isPublic: !!raw.isPublic,
          mode: (raw.mode as GameMode) ?? "normal",
          categorySlugs: Array.isArray(raw.categorySlugs) ? raw.categorySlugs : [],
          playerCount: Number(raw.playerCount ?? 0),
          maxPlayers: Number(raw.maxPlayers ?? 8),
          hostName: typeof raw.hostName === "string" ? raw.hostName : "",
          phase: (raw.phase as LobbyRegistryEntry["phase"]) ?? "lobby",
          updatedAt: Date.now(),
        };
        this.lobbies.set(entry.code, entry);
        await this.persist();
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      if (
        body &&
        typeof body === "object" &&
        (body as { type?: string }).type === "remove"
      ) {
        const code = (body as { code?: string }).code;
        if (code) {
          this.lobbies.delete(code);
          await this.persist();
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      return new Response("Bad request", { status: 400, headers: CORS_HEADERS });
    }

    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }
}
