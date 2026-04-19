#!/usr/bin/env node
/**
 * `party/words/*.ts` dosyalarındaki tüm kelimeleri Supabase `words` tablosuna
 * upsert eder. `categories` tablosundaki slug'lara göre otomatik eşleme yapar.
 *
 * Kullanım:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-words.mjs
 *
 * - SUPABASE_SERVICE_ROLE_KEY gerekli (publishable key insert için yetersiz).
 * - Bu key kesinlikle client kodunda kullanılmaz; sadece bu script için.
 * - (word, language) üzerinde UNIQUE constraint olduğundan tekrar çalıştırmak güvenli.
 */

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY env değişkenlerini ayarla.");
  console.error("   SUPABASE_SERVICE_ROLE_KEY'i Dashboard → Project Settings → API → Project API Keys → 'secret' altından al.");
  process.exit(1);
}

async function loadCategoryFiles() {
  const wordsDir = resolve(__dirname, "..", "party", "words");
  const files = readdirSync(wordsDir).filter(
    (f) => f.endsWith(".ts") && !["index.ts", "types.ts"].includes(f),
  );

  // TS dosyalarını ts'siz okuyabilmek için tsx/jiti yerine build çıktısını bekleyebilirdik,
  // ama basit tutmak için kullanıcıdan `npx tsx` ile çalıştırmasını isteyelim.
  // Zaten package.json script'ini o şekilde tanımlıyoruz.
  const results = [];
  for (const file of files) {
    const slug = file.replace(/\.ts$/, "");
    const url = pathToFileURL(resolve(wordsDir, file)).href;
    const mod = await import(url);
    const entries = mod.default ?? mod.entries ?? [];
    results.push({ slug, entries });
  }
  return results;
}

async function fetchCategories() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/categories?select=id,slug`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    },
  );
  if (!res.ok) {
    throw new Error(`categories fetch failed: ${res.status} ${await res.text()}`);
  }
  const rows = await res.json();
  return new Map(rows.map((r) => [r.slug, r.id]));
}

async function upsertWords(rows) {
  if (rows.length === 0) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/words?on_conflict=word,language`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`words upsert failed: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  console.log("📚 Kategori dosyaları yükleniyor...");
  const sources = await loadCategoryFiles();
  console.log(
    `   ${sources.length} kategori bulundu: ${sources.map((s) => `${s.slug}(${s.entries.length})`).join(", ")}`,
  );

  console.log("🔗 Supabase'den kategoriler getiriliyor...");
  const catMap = await fetchCategories();
  console.log(`   ${catMap.size} kategori kayıtlı: ${[...catMap.keys()].join(", ")}`);

  const rows = [];
  for (const { slug, entries } of sources) {
    const categoryId = catMap.get(slug);
    if (!categoryId) {
      console.warn(`⚠️  '${slug}' kategorisi Supabase'de yok, atlanıyor.`);
      continue;
    }
    for (const entry of entries) {
      if (!entry?.word || !Array.isArray(entry?.forbidden) || entry.forbidden.length < 3) {
        console.warn(`⚠️  ${slug}/${entry?.word ?? "?"}: geçersiz kayıt, atlanıyor.`);
        continue;
      }
      rows.push({
        category_id: categoryId,
        word: entry.word,
        forbidden_words: entry.forbidden.slice(0, 5),
        language: "tr",
      });
    }
  }

  console.log(`📤 ${rows.length} kelime upsert ediliyor (batch=500)...`);
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    await upsertWords(batch);
    console.log(`   ${Math.min(i + batch.length, rows.length)}/${rows.length}`);
  }
  console.log("✅ Tamam.");
}

main().catch((err) => {
  console.error("❌ Hata:", err);
  process.exit(1);
});
