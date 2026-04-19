-- Seed categories
INSERT INTO categories (slug, name_tr, name_en, icon, sort_order) VALUES
  ('genel', 'Genel Kültür', 'General Knowledge', '🌍', 1),
  ('karisik', 'Karışık', 'Mixed', '🎲', 2),
  ('oyun', 'Oyun & Eğlence', 'Games & Fun', '🎮', 3),
  ('spor', 'Spor', 'Sports', '⚽', 4),
  ('bilim', 'Bilim & Teknoloji', 'Science & Tech', '🔬', 5),
  ('tarih', 'Tarih', 'History', '📜', 6)
ON CONFLICT (slug) DO NOTHING;

-- Seed words (small sample; production needs 200+ per category)
INSERT INTO words (category_id, word, forbidden_words, language) VALUES
  ((SELECT id FROM categories WHERE slug = 'genel'), 'Güneş', ARRAY['ışık', 'sıcak', 'yıldız', 'gündüz', 'sarı'], 'tr'),
  ((SELECT id FROM categories WHERE slug = 'genel'), 'Kitap', ARRAY['okumak', 'sayfa', 'yazar', 'kütüphane', 'kapak'], 'tr'),
  ((SELECT id FROM categories WHERE slug = 'genel'), 'Kahve', ARRAY['içecek', 'sıcak', 'fincan', 'çekirdek', 'Türk'], 'tr'),
  ((SELECT id FROM categories WHERE slug = 'genel'), 'Araba', ARRAY['motor', 'tekerlek', 'yol', 'sürmek', 'benzin'], 'tr'),
  ((SELECT id FROM categories WHERE slug = 'genel'), 'Deniz', ARRAY['tuz', 'mavi', 'dalga', 'kum', 'balık'], 'tr'),
  ((SELECT id FROM categories WHERE slug = 'spor'), 'Futbol', ARRAY['top', 'kale', 'gol', 'saha', 'forma'], 'tr'),
  ((SELECT id FROM categories WHERE slug = 'spor'), 'Basketbol', ARRAY['pota', 'top', 'sayı', 'smaç', 'saha'], 'tr'),
  ((SELECT id FROM categories WHERE slug = 'oyun'), 'Satranç', ARRAY['tahta', 'şah', 'piyon', 'mat', 'vezir'], 'tr'),
  ((SELECT id FROM categories WHERE slug = 'bilim'), 'Robot', ARRAY['makine', 'yapay', 'zeka', 'metal', 'program'], 'tr'),
  ((SELECT id FROM categories WHERE slug = 'tarih'), 'Atatürk', ARRAY['kurucu', 'cumhuriyet', 'asker', 'Mustafa', 'Kemal'], 'tr')
ON CONFLICT (word, language) DO NOTHING;
