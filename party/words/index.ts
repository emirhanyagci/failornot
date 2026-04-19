import type { WordCard } from "../types";
import type { WordEntry } from "./types";

import genel from "./genel";
import spor from "./spor";
import oyun from "./oyun";
import bilim from "./bilim";
import tarih from "./tarih";

// Yeni kategori eklemek için:
// 1) party/words/<slug>.ts oluştur, `export default entries` yap.
// 2) Bu dosyanın üstüne import ekle.
// 3) CATEGORY_SOURCES listesine ekle.
// 4) src/messages/*.json ve src/app/[locale]/create/CreateLobbyForm.tsx
//    içine kategori etiketlerini ekle.
const CATEGORY_SOURCES: { slug: string; entries: WordEntry[] }[] = [
  { slug: "genel", entries: genel },
  { slug: "spor", entries: spor },
  { slug: "oyun", entries: oyun },
  { slug: "bilim", entries: bilim },
  { slug: "tarih", entries: tarih },
];

function buildCards(): WordCard[] {
  const cards: WordCard[] = [];
  for (const { slug, entries } of CATEGORY_SOURCES) {
    entries.forEach((entry, idx) => {
      if (entry.forbidden.length !== 5) {
        // Yapılandırma hatası: 5 yasak kelime zorunlu.
        // Build zamanında kontrol ettiğimiz için runtime'da sadece uyarı veriyoruz.
        console.warn(
          `[words] ${slug}/${entry.word}: beklenen 5 yasak kelime, alınan ${entry.forbidden.length}`,
        );
      }
      cards.push({
        id: `${slug}-${String(idx + 1).padStart(4, "0")}`,
        categorySlug: slug,
        word: entry.word,
        forbidden: entry.forbidden.slice(0, 5),
      });
    });
  }
  return cards;
}

export const ALL_CARDS: WordCard[] = buildCards();

export const KNOWN_CATEGORY_SLUGS = CATEGORY_SOURCES.map((c) => c.slug);
