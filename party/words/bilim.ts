import type { WordEntry } from "./types";

// Bilim & Teknoloji kategorisi.
const entries: WordEntry[] = [
  { word: "Robot", forbidden: ["makine", "yapay", "zeka", "metal", "program"] },
  { word: "Gezegen", forbidden: ["uzay", "dünya", "yörünge", "güneş", "mars"] },
  { word: "Atom", forbidden: ["proton", "elektron", "çekirdek", "parçacık", "kimya"] },
  { word: "İnternet", forbidden: ["ağ", "web", "bağlantı", "online", "wifi"] },
  { word: "Elektrik", forbidden: ["akım", "priz", "kablo", "ampul", "voltaj"] },
];

export default entries;
