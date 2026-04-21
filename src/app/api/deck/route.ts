import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { WordCard } from "@/types/game";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PartyKit sunucusu oyun başlangıcında bu endpoint'i çağırır.
 * Statik dosyalardaki kelimelerle Supabase'e admin UI'dan eklenen kelimeleri
 * tek bir deck altında birleştirir.
 *
 * Query:
 *   ?slugs=genel,spor        → sadece bu kategorilerden
 *   ?slugs=karisik           → tümü
 *   boş                      → tümü
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slugsParam = url.searchParams.get("slugs") ?? "";
  const requested = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const useAll = requested.length === 0 || requested.includes("karisik");
  const requestedSlugs = requested.filter((s) => s !== "karisik");

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supaUrl || !supaKey) {
    return NextResponse.json(
      { error: "SUPABASE_NOT_CONFIGURED", cards: [], count: 0, slugs: [] },
      { status: 503 },
    );
  }

  const sb = createClient(supaUrl, supaKey, {
    auth: { persistSession: false },
  });

  let categoriesQuery = sb.from("categories").select("id, slug");
  if (!useAll) {
    categoriesQuery = categoriesQuery.eq("is_active", true);
    categoriesQuery = categoriesQuery.in("slug", requestedSlugs);
  }
  const { data: cats, error: categoriesError } = await categoriesQuery;
  if (categoriesError) {
    return NextResponse.json(
      { error: categoriesError.message, cards: [], count: 0, slugs: requestedSlugs },
      { status: 500 },
    );
  }

  const idToSlug = new Map<string, string>();
  for (const c of (cats ?? []) as Array<{ id: string; slug: string }>) {
    idToSlug.set(c.id, c.slug);
  }
  const ids = Array.from(idToSlug.keys());
  if (!useAll && ids.length === 0) {
    return NextResponse.json(
      { cards: [], count: 0, slugs: useAll ? [] : requestedSlugs },
      {
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  let wordsQuery = sb
    .from("words")
    .select("id, word, forbidden_words, category_id")
    .eq("is_active", true)
    .eq("language", "tr");
  if (!useAll) {
    wordsQuery = wordsQuery.in("category_id", ids);
  }
  const { data: rows, error: wordsError } = await wordsQuery;
  if (wordsError) {
    return NextResponse.json(
      { error: wordsError.message, cards: [], count: 0, slugs: useAll ? [] : requestedSlugs },
      { status: 500 },
    );
  }

  const cards: WordCard[] = [];
  for (const row of (rows ?? []) as Array<{
    id: string;
    word: string;
    forbidden_words: string[] | null;
    category_id: string;
  }>) {
    const catSlug = idToSlug.get(row.category_id);
    if (!catSlug) continue;
    cards.push({
      id: `db-${row.id}`,
      categorySlug: catSlug,
      word: row.word,
      forbidden: (row.forbidden_words ?? []).slice(0, 5),
    });
  }

  return NextResponse.json(
    {
      cards,
      count: cards.length,
      slugs: useAll ? Array.from(new Set(cards.map((c) => c.categorySlug))) : requestedSlugs,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
