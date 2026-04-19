import type {
  GameState,
  LobbySettings,
  LobbyState,
  Player,
  RoundEvent,
  Team,
  WordCard,
} from "./game";

export type ClientMessage =
  | { type: "join"; payload: { username: string; avatarId: string; secret: string } }
  | { type: "rejoin"; payload: { secret: string } }
  | { type: "leave" }
  | { type: "update_settings"; payload: Partial<LobbySettings> }
  | { type: "assign_team"; payload: { playerId: string; team: Team | null } }
  | { type: "shuffle_teams" }
  | { type: "swap_teams" }
  | { type: "start_game" }
  | { type: "correct" }
  | { type: "pass" }
  | { type: "foul" }
  | { type: "next_word" }
  | { type: "kick"; payload: { playerId: string } }
  | { type: "return_to_lobby" }
  | { type: "play_again" };

export type ServerMessage =
  | { type: "lobby_state"; payload: LobbyState }
  | { type: "game_state"; payload: GameState }
  | { type: "word_reveal"; payload: WordCard }
  | { type: "timer_tick"; payload: { remaining: number } }
  | { type: "bomb_tick"; payload: { holder: Team; remaining: number } }
  | { type: "player_joined"; payload: Player }
  | { type: "player_left"; payload: { playerId: string; username: string } }
  | { type: "host_changed"; payload: { newHostId: string; newHostName: string } }
  | { type: "round_event"; payload: RoundEvent }
  | { type: "turn_end"; payload: { team: Team; events: RoundEvent[] } }
  | { type: "game_over"; payload: { winner: Team | "draw"; teams: GameState["teams"] } }
  | { type: "error"; payload: { code: string; message: string } }
  | { type: "you_are"; payload: { playerId: string } };
