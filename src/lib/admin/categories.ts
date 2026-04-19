import type { SupabaseClient } from "@supabase/supabase-js";

export interface CategoryRow {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

/**
 * Statik kategori tohumu — Supabase'de `categories` tablosu boşsa
 * admin ilk açtığında otomatik upsert edilir.
 * `party/words.ts` ile eşleştiriyoruz.
 */
export const SEED_CATEGORIES: Array<
  Omit<CategoryRow, "id" | "is_active"> & { is_active?: boolean }
> = [
  { slug: "genel", name_tr: "Genel Kültür", name_en: "General Knowledge", icon: "🌍", sort_order: 1 },
  { slug: "karisik", name_tr: "Karışık", name_en: "Mixed", icon: "🎲", sort_order: 2 },
  { slug: "oyun", name_tr: "Oyun & Eğlence", name_en: "Games & Fun", icon: "🎮", sort_order: 3 },
  { slug: "spor", name_tr: "Spor", name_en: "Sports", icon: "⚽", sort_order: 4 },
  { slug: "bilim", name_tr: "Bilim & Teknoloji", name_en: "Science & Tech", icon: "🔬", sort_order: 5 },
  { slug: "tarih", name_tr: "Tarih", name_en: "History", icon: "📜", sort_order: 6 },
];

export async function ensureCategories(admin: SupabaseClient): Promise<CategoryRow[]> {
  const { data: existing, error: selErr } = await admin
    .from("categories")
    .select("id, slug, name_tr, name_en, icon, is_active, sort_order")
    .order("sort_order", { ascending: true });
  if (selErr) throw selErr;
  if (existing && existing.length > 0) return existing as CategoryRow[];

  const { error: upErr } = await admin
    .from("categories")
    .upsert(
      SEED_CATEGORIES.map((c) => ({ ...c, is_active: true })),
      { onConflict: "slug" },
    );
  if (upErr) throw upErr;

  const { data: seeded, error: refetchErr } = await admin
    .from("categories")
    .select("id, slug, name_tr, name_en, icon, is_active, sort_order")
    .order("sort_order", { ascending: true });
  if (refetchErr) throw refetchErr;
  return (seeded ?? []) as CategoryRow[];
}

export async function getCategorySlugToId(
  admin: SupabaseClient,
): Promise<Map<string, string>> {
  const rows = await ensureCategories(admin);
  const map = new Map<string, string>();
  for (const r of rows) map.set(r.slug, r.id);
  return map;
}
