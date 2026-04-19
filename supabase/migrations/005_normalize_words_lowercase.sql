-- Mevcut tüm kelimeleri ve yasaklı kelimeleri küçük harfe çek (Türkçe locale ile).
--
-- Karışık case'li ("Güneş" + "güneş") çift kayıtları teke indirmek için:
--   1) Önce yasaklı kelime dizilerini lowercase yap.
--   2) Aynı (lower(word), language) için en eski kaydı tutup diğerlerini sil.
--   3) Word kolonunu lowercase'e çek.
--   4) Bundan sonra her INSERT/UPDATE'te DB seviyesinde lowercase'e zorla.

BEGIN;

-- 1) forbidden_words içindeki tüm elemanları lowercase yap (NULL güvenli).
UPDATE words
SET forbidden_words = (
  SELECT ARRAY(
    SELECT lower(elem)
    FROM unnest(forbidden_words) AS elem
  )
)
WHERE forbidden_words IS NOT NULL;

-- 2) Aynı (lower(word), language) için en eski kaydı tut, diğer duplicate'leri sil.
--    Böylece adım 3'teki UPDATE UNIQUE constraint'i ihlal etmez.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(word), language
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM words
)
DELETE FROM words
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- 3) Word kolonunu küçük harfe çek.
UPDATE words
SET word = lower(word)
WHERE word <> lower(word);

-- 4) DB seviyesinde lowercase garantisi: trigger ile her INSERT/UPDATE'te
--    word ve forbidden_words otomatik küçük harfe çevrilir.
CREATE OR REPLACE FUNCTION words_normalize_lowercase()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.word IS NOT NULL THEN
    NEW.word := lower(btrim(NEW.word));
  END IF;
  IF NEW.forbidden_words IS NOT NULL THEN
    NEW.forbidden_words := (
      SELECT ARRAY(
        SELECT lower(btrim(elem))
        FROM unnest(NEW.forbidden_words) AS elem
        WHERE elem IS NOT NULL AND btrim(elem) <> ''
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_words_normalize_lowercase ON words;
CREATE TRIGGER trg_words_normalize_lowercase
BEFORE INSERT OR UPDATE ON words
FOR EACH ROW
EXECUTE FUNCTION words_normalize_lowercase();

COMMIT;
