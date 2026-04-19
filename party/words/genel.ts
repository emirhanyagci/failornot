import type { WordEntry } from "./types";

// Genel Kültür kategorisi.
// Yeni kelime eklemek için bu dizinin sonuna {word, forbidden} objesi ekle.
// `forbidden` TAM 5 string içermeli.
const entries: WordEntry[] = [
  { word: "Güneş", forbidden: ["ışık", "sıcak", "yıldız", "gündüz", "sarı"] },
  { word: "Kitap", forbidden: ["okumak", "sayfa", "yazar", "kütüphane", "kapak"] },
  { word: "Kahve", forbidden: ["içecek", "sıcak", "fincan", "çekirdek", "Türk"] },
  { word: "Araba", forbidden: ["motor", "tekerlek", "yol", "sürmek", "benzin"] },
  { word: "Deniz", forbidden: ["tuz", "mavi", "dalga", "kum", "balık"] },
  { word: "Yağmur", forbidden: ["su", "bulut", "şemsiye", "ıslak", "gökyüzü"] },
  { word: "Telefon", forbidden: ["aramak", "ekran", "mesaj", "numara", "mobil"] },
  { word: "Okul", forbidden: ["öğrenci", "öğretmen", "sınıf", "ders", "çanta"] },
  { word: "Pizza", forbidden: ["peynir", "domates", "İtalyan", "dilim", "fırın"] },
  { word: "Bisiklet", forbidden: ["pedal", "tekerlek", "sürmek", "iki", "zincir"] },
  { word: "Fırın", forbidden: ["pişirmek", "ekmek", "sıcak", "mutfak", "pasta"] },
  { word: "Kalem", forbidden: ["yazmak", "uç", "kağıt", "kurşun", "silgi"] },
  { word: "Saat", forbidden: ["zaman", "ibre", "dakika", "kol", "duvar"] },
  { word: "Televizyon", forbidden: ["ekran", "izlemek", "kanal", "uzaktan", "dizi"] },
  { word: "Gitar", forbidden: ["tel", "akor", "çalmak", "müzik", "ağaç"] },
  { word: "Penguen", forbidden: ["kuş", "buz", "Antarktika", "soğuk", "yüzmek"] },
  { word: "Dondurma", forbidden: ["soğuk", "tatlı", "külah", "çikolata", "vanilya"] },
  { word: "Uçak", forbidden: ["uçmak", "kanat", "pilot", "havaalanı", "gökyüzü"] },
  { word: "Kutup", forbidden: ["soğuk", "buz", "ayı", "kuzey", "güney"] },
  { word: "Orman", forbidden: ["ağaç", "yeşil", "hayvan", "yaprak", "doğa"] },
];

export default entries;
