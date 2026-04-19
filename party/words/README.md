# Kelime Eklemek

## Admin UI (en hızlı yol — canlı ekleme, deploy gerektirmez)

1. `.env.local` içinde şunları tanımla:
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase → API → service_role)
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD` (default: `emirhan.yac` / `12345679`)
2. Dev sunucuyu çalıştır: `npm run dev`
3. Tarayıcıda `http://localhost:3000/tr/admin` aç.
4. Giriş yap → iki sekme:
   - **Tek Kelime:** form ile 1 kelime + 5 yasak kelime.
   - **JSON Toplu Yükleme:** `.json` dosyası seç ya da metni yapıştır.

JSON formatı:

```json
[
  { "word": "Güneş", "forbidden": ["ışık", "sıcak", "yıldız", "gündüz", "sarı"] },
  { "word": "Basketbol", "forbidden": ["pota", "top", "sayı", "smaç", "saha"], "categorySlug": "spor" }
]
```

`categorySlug` verilmezse UI'daki "varsayılan kategori" kullanılır. Eklenen kelimeler
`/api/deck` üzerinden PartyKit'e geçer — oyun başlatıldığında hemen görünür
(yeniden deploy gerekmez).

## Hızlı Yöntem (statik dosya — kod değişikliği)

1. İlgili kategori dosyasını aç: `party/words/genel.ts`, `spor.ts`, vb.
2. `entries` dizisinin sonuna yeni kelimeni ekle:

```ts
{ word: "Çiçek", forbidden: ["açmak", "yaprak", "bahçe", "koklamak", "güzel"] },
```

**Kurallar:**
- `word` — tahmin edilecek kelime (Türkçe karakter destekli).
- `forbidden` — **tam 5** yasak kelime içeren dizi.
- `id` ve `categorySlug` alanlarını yazmana gerek yok; loader otomatik ekler.
- Aynı kelimeyi iki kere eklememeye dikkat et.

Dosyayı kaydettiğinde `npm run party:dev` otomatik yeniden yüklenir ve yeni oyunda
kelimeler kullanılabilir.

## Yeni Kategori Eklemek

1. `party/words/<slug>.ts` oluştur (örn. `yemek.ts`). İçeriği şöyle:

   ```ts
   import type { WordEntry } from "./types";
   const entries: WordEntry[] = [
     { word: "Mantı", forbidden: ["hamur", "et", "yoğurt", "Kayseri", "Türk"] },
   ];
   export default entries;
   ```

2. `party/words/index.ts` dosyasına import + `CATEGORY_SOURCES` listesine kaydı ekle.

3. `src/messages/tr.json` ve `src/messages/en.json` içindeki
   `create.categories` objesine slug'ı ekle.

4. `src/app/[locale]/create/CreateLobbyForm.tsx` içindeki `CATEGORY_SLUGS`
   dizisine ekle.

## Supabase'e Toplu Yükleme (ilerisi için)

`words` tablosuna tüm kategori dosyalarındaki kelimeleri upsert eder:

```bash
SUPABASE_URL=https://xxxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
npm run words:import
```

- **Service role key gerekli** (publishable key insert için yetersiz).
- Supabase Dashboard → Project Settings → API → "secret" etiketli key.
- `(word, language)` üzerinde unique constraint var; idempotent, istediğin
  kadar çalıştırabilirsin.
