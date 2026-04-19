import type { WordEntry } from "./types";

// Spor kategorisi.
const entries: WordEntry[] = [
  { word: "Futbol", forbidden: ["top", "kale", "gol", "saha", "forma"] },
  { word: "Basketbol", forbidden: ["pota", "top", "sayı", "smaç", "saha"] },
  { word: "Yüzme", forbidden: ["havuz", "su", "kulaç", "olimpiyat", "kurbağalama"] },
  { word: "Tenis", forbidden: ["raket", "kort", "servis", "file", "top"] },
  { word: "Boks", forbidden: ["eldiven", "ring", "yumruk", "nakavt", "antrenör"] },
];

export default entries;
