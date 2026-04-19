import type { WordCard } from "./types";
import { ALL_CARDS, KNOWN_CATEGORY_SLUGS } from "./words/index";

// Tüm kategorilerin kartlarını birleştirilmiş halde dışa aktarıyoruz.
// Asıl kelime verisi `party/words/<kategori>.ts` dosyalarında tutuluyor;
// binlerce kelimeye ölçeklendirmek için oradan ekleyeceksin.
export const SEED_WORDS: WordCard[] = ALL_CARDS;

export const CATEGORIES = [
  { slug: "genel", name_tr: "Genel Kültür", icon: "🌍" },
  { slug: "karisik", name_tr: "Karışık", icon: "🎲" },
  { slug: "oyun", name_tr: "Oyun & Eğlence", icon: "🎮" },
  { slug: "spor", name_tr: "Spor", icon: "⚽" },
  { slug: "bilim", name_tr: "Bilim & Teknoloji", icon: "🔬" },
  { slug: "tarih", name_tr: "Tarih", icon: "📜" },
];

/**
 * Seçilen kategoriler için bir kelime destesi oluşturur.
 * - "karisik" seçilirse veya hiçbir kategori yoksa tüm kelimeler döner.
 * - Geçerli olmayan kategori slug'ları sessizce atlanır.
 */
export function pickDeck(categorySlugs: string[]): WordCard[] {
  if (categorySlugs.length === 0 || categorySlugs.includes("karisik")) {
    return [...SEED_WORDS];
  }
  const valid = new Set(categorySlugs.filter((s) => KNOWN_CATEGORY_SLUGS.includes(s)));
  if (valid.size === 0) return [...SEED_WORDS];
  return SEED_WORDS.filter((w) => valid.has(w.categorySlug));
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
