export interface WordInput {
  word: string;
  forbidden: string[];
  categorySlug?: string;
  difficulty?: number;
  language?: string;
}

export interface ValidatedWord {
  word: string;
  forbidden_words: string[];
  difficulty: number;
  language: string;
  categorySlug: string;
}

export interface WordValidationError {
  index: number;
  reason: string;
  raw: unknown;
}

export interface WordValidationResult {
  valid: ValidatedWord[];
  errors: WordValidationError[];
}

/**
 * Ham kullanıcı girişini temizleyip doğrular.
 * - word: 1..64 karakter, boşluklar trim
 * - forbidden: 5 tane, her biri 1..32 karakter
 * - difficulty: 1..3, default 1
 * - language: "tr" default
 * - categorySlug: UI'dan gelen default ile doldurulabilir
 */
export function validateWords(
  raw: unknown,
  defaults: { categorySlug?: string; language?: string } = {},
): WordValidationResult {
  const items: unknown[] = Array.isArray(raw) ? raw : [raw];
  const valid: ValidatedWord[] = [];
  const errors: WordValidationError[] = [];
  const seen = new Set<string>();

  items.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      errors.push({ index, reason: "NOT_OBJECT", raw: item });
      return;
    }
    const entry = item as Record<string, unknown>;

    const wordRaw = entry.word;
    if (typeof wordRaw !== "string") {
      errors.push({ index, reason: "WORD_MISSING", raw: item });
      return;
    }
    const word = wordRaw.trim();
    if (word.length === 0 || word.length > 64) {
      errors.push({ index, reason: "WORD_LENGTH", raw: item });
      return;
    }

    const forbiddenRaw = entry.forbidden ?? entry.forbidden_words;
    if (!Array.isArray(forbiddenRaw)) {
      errors.push({ index, reason: "FORBIDDEN_NOT_ARRAY", raw: item });
      return;
    }
    const forbidden = forbiddenRaw
      .map((f) => (typeof f === "string" ? f.trim() : ""))
      .filter((f) => f.length > 0);
    if (forbidden.length !== 5) {
      errors.push({ index, reason: "FORBIDDEN_MUST_BE_5", raw: item });
      return;
    }
    if (forbidden.some((f) => f.length > 32)) {
      errors.push({ index, reason: "FORBIDDEN_TOO_LONG", raw: item });
      return;
    }

    const categorySlug =
      (typeof entry.categorySlug === "string" && entry.categorySlug) ||
      (typeof entry.category === "string" && entry.category) ||
      defaults.categorySlug;
    if (!categorySlug || typeof categorySlug !== "string") {
      errors.push({ index, reason: "CATEGORY_MISSING", raw: item });
      return;
    }

    let difficulty = 1;
    if (typeof entry.difficulty === "number") {
      const d = Math.floor(entry.difficulty);
      if (d >= 1 && d <= 3) difficulty = d;
    }

    const language =
      (typeof entry.language === "string" && entry.language) ||
      defaults.language ||
      "tr";

    const dedupKey = `${word.toLowerCase()}::${language}`;
    if (seen.has(dedupKey)) {
      errors.push({ index, reason: "DUPLICATE_IN_BATCH", raw: item });
      return;
    }
    seen.add(dedupKey);

    valid.push({
      word,
      forbidden_words: forbidden,
      difficulty,
      language,
      categorySlug,
    });
  });

  return { valid, errors };
}
