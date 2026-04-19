// Kelime dosyaları için paylaşılan tip. Her kategori dosyası bu tipte
// bir dizi export eder. `id` ve `categorySlug` loader tarafından otomatik
// eklendiği için burada yazmana gerek yok.
export interface WordEntry {
  word: string;
  forbidden: [string, string, string, string, string];
}
