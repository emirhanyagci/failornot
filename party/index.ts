import type * as Party from "partykit/server";
import type {
  ClientMessage,
  GameState,
  LobbySettings,
  LobbyState,
  Player,
  ServerMessage,
  Team,
  TeamStats,
  TurnState,
  WordCard,
} from "./types";
import { pickDeck, shuffle } from "./words";

/**
 * PartyKit Cloudflare Workers'ta çalışıyor.
 * `fetch()` globally mevcut; Next.js API'den merged deck'i çekiyoruz.
 * APP_URL:
 *   - partykit.json > vars > APP_URL
 *   - veya `partykit env add APP_URL ...` ile prod'a verilebilir
 *   - yoksa localhost:3000
 */
function getAppUrl(env: Record<string, unknown>): string {
  const raw = typeof env.APP_URL === "string" ? (env.APP_URL as string) : "";
  const trimmed = raw.trim().replace(/\/$/, "");
  return trimmed || "http://localhost:3000";
}

async function fetchDeckFromApi(
  env: Record<string, unknown>,
  slugs: string[],
): Promise<WordCard[] | null> {
  try {
    const base = getAppUrl(env);
    const qs = slugs.length ? `?slugs=${encodeURIComponent(slugs.join(","))}` : "";
    const res = await fetch(`${base}/api/deck${qs}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { cards?: WordCard[] };
    if (!json || !Array.isArray(json.cards) || json.cards.length === 0) return null;
    return json.cards;
  } catch {
    return null;
  }
}

const DEFAULT_SETTINGS: LobbySettings = {
  mode: "normal",
  categorySlugs: ["genel"],
  roundTime: 60,
  targetScore: 30,
  passLimit: 3,
  isPublic: false,
  maxPlayers: 8,
};

const RECONNECT_GRACE_MS = 30_000;
const BOMB_INITIAL = 30;
const SUDDEN_DEATH_INITIAL = 45;
const BOMB_STARTING_LIVES = 3;

function emptyStats(mode: string): TeamStats {
  return {
    score: 0,
    correct: 0,
    fouls: 0,
    ...(mode === "bomb" ? { lives: BOMB_STARTING_LIVES } : {}),
  };
}

export default class GameServer implements Party.Server {
  // connection.id -> player.id mapping for this session
  connToPlayer = new Map<string, string>();
  // pending disconnect timers, so we can cancel on reconnect
  disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  state: GameState = {
    phase: "lobby",
    mode: DEFAULT_SETTINGS.mode,
    settings: { ...DEFAULT_SETTINGS },
    players: [],
    hostId: "",
    teams: { A: emptyStats("normal"), B: emptyStats("normal") },
    turn: null,
    timer: 0,
    turnOrder: { A: [], B: [] },
    turnIndex: { A: 0, B: 0 },
  };

  deck: WordCard[] = [];
  deckIndex = 0;
  timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(readonly room: Party.Room) {}

  // ---------- Party lifecycle ----------

  onConnect(conn: Party.Connection) {
    this.sendState(conn);
  }

  onMessage(raw: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw) as ClientMessage;
    } catch {
      return this.sendError(sender, "BAD_MESSAGE", "Invalid JSON");
    }

    switch (msg.type) {
      case "join":
        return this.handleJoin(sender, msg.payload);
      case "leave":
        return this.handleLeave(sender);
      case "update_settings":
        return this.handleUpdateSettings(sender, msg.payload);
      case "assign_team":
        return this.handleAssignTeam(sender, msg.payload);
      case "shuffle_teams":
        return this.handleShuffleTeams(sender);
      case "swap_teams":
        return this.handleSwapTeams(sender);
      case "start_game":
        return this.handleStartGame(sender);
      case "correct":
        return this.handleCorrect(sender);
      case "pass":
        return this.handlePass(sender);
      case "foul":
        return this.handleFoul(sender);
      case "next_word":
        return this.handleNextWord(sender);
      case "kick":
        return this.handleKick(sender, msg.payload);
      case "return_to_lobby":
        return this.handleReturnToLobby(sender);
      case "play_again":
        return this.handlePlayAgain(sender);
    }
  }

  onClose(conn: Party.Connection) {
    const playerId = this.connToPlayer.get(conn.id);
    if (!playerId) return;
    this.connToPlayer.delete(conn.id);

    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    player.status = "disconnected";
    this.broadcast({ type: "player_left", payload: { playerId: player.id, username: player.username } });
    this.sendStateAll();

    const timer = setTimeout(() => {
      this.removePlayer(playerId);
    }, RECONNECT_GRACE_MS);
    this.disconnectTimers.set(playerId, timer);
  }

  // ---------- Join / Reattach ----------

  private handleJoin(
    conn: Party.Connection,
    payload: { username: string; avatarId: string; secret: string },
  ) {
    const username = (payload.username || "").trim().slice(0, 16);
    const avatarId = payload.avatarId || "avatar-01";
    if (!username) return this.sendError(conn, "EMPTY_USERNAME", "Kullanıcı adı gerekli");

    // If a player with this secret already exists (same browser reconnecting
    // within the grace window or even after a page reload), treat this as a
    // rejoin instead of creating a duplicate player. This also allows the
    // original player to come back mid-game.
    if (payload.secret) {
      const existing = this.state.players.find((p) => p.secret === payload.secret);
      if (existing) {
        this.reattachPlayer(conn, existing, { username, avatarId });
        return;
      }
    }

    if (this.state.phase !== "lobby") {
      return this.sendError(conn, "GAME_IN_PROGRESS", "Oyun devam ediyor");
    }
    if (this.state.players.length >= this.state.settings.maxPlayers) {
      return this.sendError(conn, "LOBBY_FULL", "Lobi dolu");
    }

    // unique username within lobby
    let finalName = username;
    let suffix = 1;
    while (this.state.players.some((p) => p.username === finalName)) {
      suffix++;
      finalName = `${username}${suffix}`;
    }

    const player: Player = {
      id: crypto.randomUUID(),
      username: finalName,
      avatarId,
      team: this.nextAutoTeam(),
      isHost: this.state.players.length === 0,
      status: "connected",
      secret: payload.secret,
    };

    if (player.isHost) this.state.hostId = player.id;
    this.state.players.push(player);
    this.connToPlayer.set(conn.id, player.id);

    conn.send(JSON.stringify({ type: "you_are", payload: { playerId: player.id } } satisfies ServerMessage));
    this.broadcast({ type: "player_joined", payload: player });
    this.sendStateAll();
  }

  /**
   * Reattach a connection to an already-existing player (same `secret`).
   * Cancels any pending disconnect cleanup, marks the player connected,
   * remaps the conn.id, and — while still in lobby — lets them refresh
   * their username/avatar from the latest local state.
   */
  private reattachPlayer(
    conn: Party.Connection,
    existing: Player,
    opts?: { username?: string; avatarId?: string },
  ) {
    const pendingTimer = this.disconnectTimers.get(existing.id);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.disconnectTimers.delete(existing.id);
    }

    // Drop any stale conn -> player mappings for this player before remapping.
    for (const [cid, pid] of this.connToPlayer) {
      if (pid === existing.id && cid !== conn.id) {
        this.connToPlayer.delete(cid);
      }
    }

    existing.status = "connected";

    if (this.state.phase === "lobby") {
      const nextName = (opts?.username || "").trim().slice(0, 16);
      if (nextName && nextName !== existing.username) {
        let finalName = nextName;
        let suffix = 1;
        while (
          this.state.players.some((p) => p.id !== existing.id && p.username === finalName)
        ) {
          suffix++;
          finalName = `${nextName}${suffix}`;
        }
        existing.username = finalName;
      }
      if (opts?.avatarId) existing.avatarId = opts.avatarId;
    }

    this.connToPlayer.set(conn.id, existing.id);
    conn.send(
      JSON.stringify({
        type: "you_are",
        payload: { playerId: existing.id },
      } satisfies ServerMessage),
    );
    this.sendStateAll();
  }

  private handleLeave(conn: Party.Connection) {
    const playerId = this.connToPlayer.get(conn.id);
    if (!playerId) return;
    this.removePlayer(playerId);
    this.connToPlayer.delete(conn.id);
  }

  private removePlayer(playerId: string) {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;
    this.state.players = this.state.players.filter((p) => p.id !== playerId);

    if (this.state.hostId === playerId) {
      const next = this.state.players.find((p) => p.status === "connected");
      if (next) {
        this.state.hostId = next.id;
        next.isHost = true;
        this.broadcast({
          type: "host_changed",
          payload: { newHostId: next.id, newHostName: next.username },
        });
      }
    }

    if (this.state.players.length === 0) {
      this.cleanup();
      return;
    }

    // if active game and a team is empty, end the game
    if (this.state.phase !== "lobby") {
      const aAlive = this.state.players.some((p) => p.team === "A" && p.status === "connected");
      const bAlive = this.state.players.some((p) => p.team === "B" && p.status === "connected");
      if (!aAlive || !bAlive) {
        this.endGame(aAlive ? "A" : bAlive ? "B" : "draw");
      }
    }

    this.sendStateAll();
  }

  private nextAutoTeam(): Team {
    const a = this.state.players.filter((p) => p.team === "A").length;
    const b = this.state.players.filter((p) => p.team === "B").length;
    return a <= b ? "A" : "B";
  }

  // ---------- Host-only operations ----------

  private requireHost(conn: Party.Connection): boolean {
    const playerId = this.connToPlayer.get(conn.id);
    if (playerId !== this.state.hostId) {
      this.sendError(conn, "NOT_HOST", "Sadece lobi sahibi yapabilir");
      return false;
    }
    return true;
  }

  private handleUpdateSettings(conn: Party.Connection, patch: Partial<LobbySettings>) {
    if (!this.requireHost(conn)) return;
    if (this.state.phase !== "lobby") return;
    this.state.settings = { ...this.state.settings, ...patch };
    this.state.mode = this.state.settings.mode;
    this.sendStateAll();
  }

  private handleAssignTeam(
    conn: Party.Connection,
    payload: { playerId: string; team: Team | null },
  ) {
    if (!this.requireHost(conn)) return;
    const player = this.state.players.find((p) => p.id === payload.playerId);
    if (!player) return;
    player.team = payload.team;
    this.sendStateAll();
  }

  private handleShuffleTeams(conn: Party.Connection) {
    if (!this.requireHost(conn)) return;
    const players = shuffle(this.state.players);
    players.forEach((p, i) => {
      p.team = i % 2 === 0 ? "A" : "B";
    });
    this.sendStateAll();
  }

  private handleSwapTeams(conn: Party.Connection) {
    if (!this.requireHost(conn)) return;
    this.state.players.forEach((p) => {
      if (p.team === "A") p.team = "B";
      else if (p.team === "B") p.team = "A";
    });
    this.sendStateAll();
  }

  private handleKick(conn: Party.Connection, payload: { playerId: string }) {
    if (!this.requireHost(conn)) return;
    if (payload.playerId === this.state.hostId) return;
    this.removePlayer(payload.playerId);
  }

  // ---------- Game start ----------

  private async handleStartGame(conn: Party.Connection) {
    if (!this.requireHost(conn)) return;
    if (this.state.phase !== "lobby") return;

    const teamA = this.state.players.filter((p) => p.team === "A");
    const teamB = this.state.players.filter((p) => p.team === "B");
    if (teamA.length < 1 || teamB.length < 1) {
      return this.sendError(conn, "TEAMS_UNBALANCED", "Her takımda en az 1 oyuncu olmalı");
    }

    const mode = this.state.settings.mode;
    this.state.mode = mode;
    this.state.teams = {
      A: emptyStats(mode),
      B: emptyStats(mode),
    };
    this.state.turnOrder = {
      A: shuffle(teamA.map((p) => p.id)),
      B: shuffle(teamB.map((p) => p.id)),
    };
    this.state.turnIndex = { A: 0, B: 0 };

    // Admin UI'dan Supabase'e eklenen kelimeler dahil edilmiş deck'i
    // Next.js API'den çekiyoruz. Ulaşılamazsa statik kartlara fallback.
    const remote = await fetchDeckFromApi(
      this.room.env,
      this.state.settings.categorySlugs,
    );
    const base = remote && remote.length > 0 ? remote : pickDeck(this.state.settings.categorySlugs);
    this.deck = shuffle(base);
    this.deckIndex = 0;

    const startingTeam: Team = Math.random() < 0.5 ? "A" : "B";

    if (mode === "bomb") {
      this.state.phase = "playing";
      this.state.bombHolder = startingTeam;
      this.state.bombRemaining = BOMB_INITIAL;
      this.startTurn(startingTeam, BOMB_INITIAL);
    } else if (mode === "sudden_death") {
      this.state.phase = "playing";
      this.startTurn(startingTeam, SUDDEN_DEATH_INITIAL);
    } else {
      this.state.phase = "playing";
      this.startTurn(startingTeam, this.state.settings.roundTime);
    }
    this.sendStateAll();
  }

  // ---------- Turn lifecycle ----------

  private startTurn(team: Team, time: number) {
    const describerId = this.state.turnOrder[team][this.state.turnIndex[team] % this.state.turnOrder[team].length];
    const card = this.drawCard();
    const turn: TurnState = {
      team,
      describerId,
      currentWord: card,
      remainingPasses: this.state.settings.passLimit,
      roundResults: [],
    };
    this.state.turn = turn;
    this.state.timer = time;
    this.state.phase = "playing";

    // Reveal word only to describer's team
    this.revealWordToTeam(team, card);

    this.runTimer();
  }

  private revealWordToTeam(team: Team, card: WordCard | null) {
    if (!card) return;
    const teamPlayerIds = new Set(this.state.players.filter((p) => p.team === team).map((p) => p.id));
    for (const conn of this.room.getConnections()) {
      const pid = this.connToPlayer.get(conn.id);
      if (!pid) continue;
      // Describer's team sees the card; opponents also see it to call fouls.
      // Non-team-A/B or disconnected don't. We simply send to everyone except
      // the guessers on the describing team (who should guess blind).
      // Actually: describer sees it; their teammates should NOT see it.
      // Opponents see it to call fouls. Describer must see forbidden words.
      const player = this.state.players.find((p) => p.id === pid);
      if (!player) continue;
      const describerId = this.state.turn?.describerId;
      const isDescriber = pid === describerId;
      const isOpponent = player.team && player.team !== team;
      if (isDescriber || isOpponent) {
        conn.send(JSON.stringify({ type: "word_reveal", payload: card } satisfies ServerMessage));
      } else {
        conn.send(JSON.stringify({ type: "word_reveal", payload: { ...card, word: "", forbidden: [] } } satisfies ServerMessage));
      }
    }
    // teammate guessers also get a cleared card (so UI knows it's a new turn)
    void teamPlayerIds;
  }

  private drawCard(): WordCard | null {
    if (this.deck.length === 0) return null;
    if (this.deckIndex >= this.deck.length) {
      this.deck = shuffle(this.deck);
      this.deckIndex = 0;
    }
    return this.deck[this.deckIndex++];
  }

  private runTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state.mode === "bomb") {
        this.state.bombRemaining = Math.max(0, (this.state.bombRemaining ?? 0) - 1);
        this.broadcast({
          type: "bomb_tick",
          payload: { holder: this.state.bombHolder ?? "A", remaining: this.state.bombRemaining ?? 0 },
        });
        if ((this.state.bombRemaining ?? 0) <= 0) {
          this.handleBombExplosion();
        }
      } else {
        this.state.timer = Math.max(0, this.state.timer - 1);
        this.broadcast({ type: "timer_tick", payload: { remaining: this.state.timer } });
        if (this.state.timer <= 0) {
          this.endTurn();
        }
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ---------- Describer actions ----------

  private assertDescriber(conn: Party.Connection): boolean {
    const pid = this.connToPlayer.get(conn.id);
    return !!pid && pid === this.state.turn?.describerId;
  }

  private handleCorrect(conn: Party.Connection) {
    if (!this.state.turn || this.state.phase !== "playing") return;
    if (!this.assertDescriber(conn)) return;
    const turn = this.state.turn;
    if (!turn.currentWord) return;

    turn.roundResults.push({ type: "correct", word: turn.currentWord.word });
    this.state.teams[turn.team].correct += 1;
    this.state.teams[turn.team].score += 1;
    this.broadcast({ type: "round_event", payload: { type: "correct", word: turn.currentWord.word } });

    if (this.state.mode === "sudden_death") {
      this.state.timer += 5;
    }
    if (this.state.mode === "bomb") {
      const next: Team = turn.team === "A" ? "B" : "A";
      this.state.bombHolder = next;
      this.state.bombRemaining = BOMB_INITIAL;
      this.rotateDescriber(turn.team);
      this.startTurn(next, BOMB_INITIAL);
      this.sendStateAll();
      return;
    }

    if (this.checkGameOver()) return;
    this.advanceWord();
  }

  private handlePass(conn: Party.Connection) {
    if (!this.state.turn || this.state.phase !== "playing") return;
    if (!this.assertDescriber(conn)) return;
    const turn = this.state.turn;
    if (!turn.currentWord) return;
    if (turn.remainingPasses <= 0) return;

    turn.remainingPasses -= 1;
    turn.roundResults.push({ type: "pass", word: turn.currentWord.word });
    this.broadcast({ type: "round_event", payload: { type: "pass", word: turn.currentWord.word } });
    this.advanceWord();
  }

  private handleFoul(conn: Party.Connection) {
    if (!this.state.turn || this.state.phase !== "playing") return;
    const pid = this.connToPlayer.get(conn.id);
    if (!pid) return;
    const player = this.state.players.find((p) => p.id === pid);
    if (!player) return;
    // Faul rakipler ya da kendisi kabul eden anlatan tarafından çağrılabilir.
    // Anlatanın takım arkadaşları (tahmin edenler) çağıramaz.
    const turn = this.state.turn;
    if (player.team === turn.team && pid !== turn.describerId) return;
    if (!turn.currentWord) return;

    const stats = this.state.teams[turn.team];
    stats.fouls += 1;
    turn.roundResults.push({ type: "foul", word: turn.currentWord.word });
    this.broadcast({ type: "round_event", payload: { type: "foul", word: turn.currentWord.word } });

    if (this.state.mode === "bomb") {
      // Bomba modunda faul: önce puandan düş, puan yoksa candan düş.
      // Yeni kelime VERME — bomba karşı takıma geçer, süre 30sn'ye resetlenir.
      if (stats.score > 0) {
        stats.score -= 1;
      } else {
        stats.lives = Math.max(0, (stats.lives ?? BOMB_STARTING_LIVES) - 1);
        if ((stats.lives ?? 0) <= 0) {
          const winner: Team = turn.team === "A" ? "B" : "A";
          this.endGame(winner);
          return;
        }
      }
      const next: Team = turn.team === "A" ? "B" : "A";
      this.state.bombHolder = next;
      this.state.bombRemaining = BOMB_INITIAL;
      this.rotateDescriber(turn.team);
      this.startTurn(next, BOMB_INITIAL);
      this.sendStateAll();
      return;
    }

    // Normal & Sudden Death: standart foul cezası — puan düş, yeni kelime.
    stats.score = Math.max(0, stats.score - 1);
    if (this.state.mode === "sudden_death") {
      this.state.timer = Math.max(0, this.state.timer - 5);
    }
    if (this.checkGameOver()) return;
    this.advanceWord();
  }

  private handleNextWord(conn: Party.Connection) {
    if (!this.assertDescriber(conn)) return;
    this.advanceWord();
  }

  private advanceWord() {
    if (!this.state.turn) return;
    this.state.turn.currentWord = this.drawCard();
    this.revealWordToTeam(this.state.turn.team, this.state.turn.currentWord);
    this.sendStateAll();
  }

  private rotateDescriber(team: Team) {
    this.state.turnIndex[team] = (this.state.turnIndex[team] + 1) % (this.state.turnOrder[team].length || 1);
  }

  // ---------- Turn & game end ----------

  private endTurn() {
    this.stopTimer();
    if (!this.state.turn) return;
    const finishedTeam = this.state.turn.team;
    const events = this.state.turn.roundResults.slice();
    this.broadcast({ type: "turn_end", payload: { team: finishedTeam, events } });

    if (this.checkGameOver()) return;

    this.rotateDescriber(finishedTeam);
    const nextTeam: Team = finishedTeam === "A" ? "B" : "A";
    const time =
      this.state.mode === "sudden_death" ? SUDDEN_DEATH_INITIAL : this.state.settings.roundTime;
    this.startTurn(nextTeam, time);
    this.sendStateAll();
  }

  private handleBombExplosion() {
    this.stopTimer();
    if (!this.state.turn || this.state.mode !== "bomb") return;
    const holder = this.state.bombHolder ?? this.state.turn.team;
    const stats = this.state.teams[holder];
    stats.lives = Math.max(0, (stats.lives ?? BOMB_STARTING_LIVES) - 1);
    this.broadcast({ type: "round_event", payload: { type: "foul", word: "💣" } });

    if ((stats.lives ?? 0) <= 0) {
      const winner: Team = holder === "A" ? "B" : "A";
      this.endGame(winner);
      return;
    }
    // reset bomb, keep with same team
    this.state.bombRemaining = BOMB_INITIAL;
    this.rotateDescriber(holder);
    this.startTurn(holder, BOMB_INITIAL);
    this.sendStateAll();
  }

  private checkGameOver(): boolean {
    if (this.state.mode === "bomb") {
      const aDead = (this.state.teams.A.lives ?? 1) <= 0;
      const bDead = (this.state.teams.B.lives ?? 1) <= 0;
      if (aDead || bDead) {
        this.endGame(aDead ? "B" : "A");
        return true;
      }
      return false;
    }
    if (this.state.mode === "normal") {
      const { targetScore } = this.state.settings;
      const aWin = this.state.teams.A.score >= targetScore;
      const bWin = this.state.teams.B.score >= targetScore;
      if (aWin && bWin) {
        this.endGame(this.state.teams.A.score === this.state.teams.B.score ? "draw" : (this.state.teams.A.score > this.state.teams.B.score ? "A" : "B"));
        return true;
      }
      if (aWin) {
        this.endGame("A");
        return true;
      }
      if (bWin) {
        this.endGame("B");
        return true;
      }
    }
    return false;
  }

  private endGame(winner: Team | "draw") {
    this.stopTimer();
    this.state.phase = "game_over";
    this.state.winner = winner;
    this.broadcast({
      type: "game_over",
      payload: { winner, teams: this.state.teams },
    });
    this.sendStateAll();
  }

  // ---------- Post-game ----------

  private handleReturnToLobby(conn: Party.Connection) {
    if (!this.requireHost(conn)) return;
    this.resetToLobby();
    this.sendStateAll();
  }

  private handlePlayAgain(conn: Party.Connection) {
    if (!this.requireHost(conn)) return;
    this.resetToLobby();
    void this.handleStartGame(conn);
  }

  private resetToLobby() {
    this.stopTimer();
    this.state.phase = "lobby";
    this.state.turn = null;
    this.state.timer = 0;
    this.state.bombHolder = undefined;
    this.state.bombRemaining = undefined;
    this.state.winner = undefined;
    this.state.teams = { A: emptyStats(this.state.mode), B: emptyStats(this.state.mode) };
  }

  // ---------- Send helpers ----------

  private broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg));
  }

  private sendStateAll() {
    for (const conn of this.room.getConnections()) {
      this.sendState(conn);
    }
    this.pushRegistry();
  }

  /**
   * Notify the `lobbies` registry party about this room's latest meta,
   * so the public browse page can list it. Fire-and-forget — failures
   * must not break the game loop.
   */
  private pushRegistry(removed = false) {
    try {
      const parties = this.room.context?.parties;
      const stub = parties?.lobbies?.get("index");
      if (!stub) {
        console.warn("[lobbies] registry party stub unavailable");
        return;
      }

      const connectedPlayers = this.state.players.filter(
        (p) => p.status === "connected",
      );

      const body =
        removed || connectedPlayers.length === 0
          ? { type: "remove", code: this.room.id }
          : {
              type: "upsert",
              entry: {
                code: this.room.id,
                isPublic: this.state.settings.isPublic,
                mode: this.state.settings.mode,
                categorySlugs: this.state.settings.categorySlugs,
                playerCount: connectedPlayers.length,
                maxPlayers: this.state.settings.maxPlayers,
                hostName:
                  this.state.players.find((p) => p.id === this.state.hostId)
                    ?.username ?? "",
                phase: this.state.phase,
              },
            };

      // Durable Object / PartyKit stubs require a Request with a URL.
      const req = new Request("https://party-internal/parties/lobbies/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      void stub
        .fetch(req)
        .then(async (res) => {
          if (!res.ok) {
            console.warn(
              "[lobbies] registry push failed",
              res.status,
              await res.text().catch(() => ""),
            );
          }
        })
        .catch((err) => {
          console.warn("[lobbies] registry push errored", err);
        });
    } catch (err) {
      console.warn("[lobbies] pushRegistry threw", err);
    }
  }

  private sendState(conn: Party.Connection) {
    if (this.state.phase === "lobby") {
      const lobby: LobbyState = {
        code: this.room.id,
        hostId: this.state.hostId,
        settings: this.state.settings,
        players: this.state.players.map(stripSecret),
        phase: "lobby",
      };
      conn.send(JSON.stringify({ type: "lobby_state", payload: lobby } satisfies ServerMessage));
    } else {
      const safe: GameState = {
        ...this.state,
        players: this.state.players.map(stripSecret),
        turn: this.state.turn
          ? {
              ...this.state.turn,
              // hide current word in main state; revealed separately to relevant players
              currentWord: this.state.turn.currentWord
                ? { ...this.state.turn.currentWord, word: "", forbidden: [] }
                : null,
            }
          : null,
      };
      conn.send(JSON.stringify({ type: "game_state", payload: safe } satisfies ServerMessage));
    }
  }

  private sendError(conn: Party.Connection, code: string, message: string) {
    conn.send(JSON.stringify({ type: "error", payload: { code, message } } satisfies ServerMessage));
  }

  private cleanup() {
    this.stopTimer();
    for (const t of this.disconnectTimers.values()) clearTimeout(t);
    this.disconnectTimers.clear();
    this.pushRegistry(true);
    this.state = {
      phase: "lobby",
      mode: DEFAULT_SETTINGS.mode,
      settings: { ...DEFAULT_SETTINGS },
      players: [],
      hostId: "",
      teams: { A: emptyStats("normal"), B: emptyStats("normal") },
      turn: null,
      timer: 0,
      turnOrder: { A: [], B: [] },
      turnIndex: { A: 0, B: 0 },
    };
  }
}

function stripSecret(p: Player): Player {
  const { secret: _secret, ...rest } = p;
  return rest;
}
