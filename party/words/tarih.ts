import type { WordEntry } from "./types";

// Tarih kategorisi.
const entries: WordEntry[] = [
  { word: "Atatürk", forbidden: ["kurucu", "cumhuriyet", "asker", "Mustafa", "Kemal"] },
  { word: "Piramit", forbidden: ["Mısır", "firavun", "üçgen", "taş", "mezar"] },
  { word: "Şövalye", forbidden: ["at", "kılıç", "zırh", "kral", "orta çağ"] },
  { word: "İmparator", forbidden: ["Roma", "taht", "krallık", "fetih", "ordu"] },
  { word: "Keşif", forbidden: ["Kolomb", "Amerika", "bulmak", "gezgin", "yeni"] },
];

export default entries;
