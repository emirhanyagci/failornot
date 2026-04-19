import { NextResponse } from "next/server";
import { requireAdminOr401 } from "@/lib/admin/guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getCategorySlugToId } from "@/lib/admin/categories";
import { validateWords } from "@/lib/admin/words";

export const runtime = "nodejs";

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message?: unknown }).message ?? "UNKNOWN");
  }
  return "UNKNOWN";
}

/**
 * Tek kelime ekleme.
 * POST body: { word, forbidden[5], categorySlug, difficulty?, language? }
 */
export async function POST(request: Request) {
  const unauth = await requireAdminOr401();
  if (unauth) return unauth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const { valid, errors } = validateWords(body);
  if (valid.length === 0) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION_FAILED", errors },
      { status: 400 },
    );
  }

  try {
    const slugMap = await getCategorySlugToId(admin);
    const row = valid[0];
    const categoryId = slugMap.get(row.categorySlug);
    if (!categoryId) {
      return NextResponse.json(
        { ok: false, error: "UNKNOWN_CATEGORY", categorySlug: row.categorySlug },
        { status: 400 },
      );
    }

    const { data, error } = await admin
      .from("words")
      .upsert(
        {
          category_id: categoryId,
          word: row.word,
          forbidden_words: row.forbidden_words,
          difficulty: row.difficulty,
          language: row.language,
          is_active: true,
        },
        { onConflict: "word,language", ignoreDuplicates: false },
      )
      .select("id, word, language, category_id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, word: data });
  } catch (e) {
    const msg = getErrorMessage(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * Listeleme (opsiyonel ama admin UI'da doğrulama için faydalı).
 * GET /api/admin/words?category=genel&q=...&page=1&limit=50
 */
export async function GET(request: Request) {
  const unauth = await requireAdminOr401();
  if (unauth) return unauth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const q = url.searchParams.get("q");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? "50") || 50));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = admin
      .from("words")
      .select(
        "id, word, forbidden_words, difficulty, language, is_active, category:categories!inner(slug, name_tr, icon)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (category) {
      const slugMap = await getCategorySlugToId(admin);
      const catId = slugMap.get(category);
      if (!catId) {
        return NextResponse.json({ ok: true, words: [], total: 0, page, limit });
      }
      query = query.eq("category_id", catId);
    }
    if (q && q.trim()) {
      query = query.ilike("word", `%${q.trim()}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      words: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (e) {
    const msg = getErrorMessage(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
