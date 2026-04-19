import type { WordEntry } from "./types";

// Oyun & Eğlence kategorisi.
const entries: WordEntry[] = [
  { word: "Satranç", forbidden: ["tahta", "şah", "piyon", "mat", "vezir"] },
  { word: "Tabu", forbidden: ["kelime", "yasak", "anlatmak", "takım", "süre"] },
  { word: "Monopoly", forbidden: ["para", "emlak", "zar", "banka", "otel"] },
  { word: "Puzzle", forbidden: ["parça", "birleştir", "resim", "yapboz", "karton"] },
  { word: "Lego", forbidden: ["yapı", "parça", "plastik", "çocuk", "yapıştır"] },
];

export default entries;
