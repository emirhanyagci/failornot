CREATE TABLE IF NOT EXISTS word_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  forbidden_words TEXT[] NOT NULL,
  category_slug TEXT NOT NULL,
  language TEXT DEFAULT 'tr',
  submitted_by TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE word_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suggestions_insert" ON word_suggestions FOR INSERT WITH CHECK (true);
