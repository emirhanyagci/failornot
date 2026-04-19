CREATE TABLE IF NOT EXISTS game_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_code TEXT NOT NULL,
  game_mode TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  team_a_score INTEGER DEFAULT 0,
  team_b_score INTEGER DEFAULT 0,
  winner TEXT,
  round_count INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  player_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history_insert" ON game_history FOR INSERT WITH CHECK (true);
CREATE POLICY "history_read" ON game_history FOR SELECT USING (true);
