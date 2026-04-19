CREATE TABLE IF NOT EXISTS words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  forbidden_words TEXT[] NOT NULL,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  language TEXT DEFAULT 'tr' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(word, language)
);

CREATE INDEX IF NOT EXISTS idx_words_category_lang ON words(category_id, language, is_active);

ALTER TABLE words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "words_read" ON words FOR SELECT USING (is_active = true);
