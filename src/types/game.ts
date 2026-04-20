export type Team = "A" | "B";

export type GameMode = "normal" | "sudden_death" | "bomb";

export type PlayerStatus = "connected" | "disconnected";

export interface Player {
  id: string;
  username: string;
  avatarId: string;
  team: Team | null;
  isHost: boolean;
  status: PlayerStatus;
  secret?: string;
}

export interface WordCard {
  id: string;
  word: string;
  forbidden: string[];
  categorySlug: string;
}

export interface LobbySettings {
  mode: GameMode;
  categorySlugs: string[];
  roundTime: number; // seconds
  targetScore: number;
  passLimit: number;
  isPublic: boolean;
  maxPlayers: number;
}

export interface TeamStats {
  score: number;
  correct: number;
  fouls: number;
}

export interface GamePhase {
  phase: "lobby" | "countdown" | "playing" | "turn_end" | "game_over";
}

export interface TurnState {
  team: Team;
  describerId: string;
  currentWord: WordCard | null;
  remainingPasses: number;
  roundResults: RoundEvent[];
}

export type RoundEvent =
  | { type: "correct"; word: string }
  | { type: "pass"; word: string }
  | { type: "foul"; word: string };

export interface GameState {
  phase: GamePhase["phase"];
  mode: GameMode;
  settings: LobbySettings;
  players: Player[];
  hostId: string;
  teams: Record<Team, TeamStats>;
  turn: TurnState | null;
  timer: number;
  bombHolder?: Team;
  bombRemaining?: number;
  turnOrder: Record<Team, string[]>;
  turnIndex: Record<Team, number>;
  winner?: Team | "draw";
}

export interface LobbyState {
  code: string;
  hostId: string;
  settings: LobbySettings;
  players: Player[];
  phase: "lobby";
}
