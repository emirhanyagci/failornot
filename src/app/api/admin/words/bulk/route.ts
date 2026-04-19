import { NextResponse } from "next/server";
import { requireAdminOr401 } from "@/lib/admin/guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getCategorySlugToId } from "@/lib/admin/categories";
import { validateWords } from "@/lib/admin/words";

export const runtime = "nodejs";

const BATCH = 500;

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message?: unknown }).message ?? "UNKNOWN");
  }
  return "UNKNOWN";
}

/**
 * JSON dosyasından / textarea'dan toplu kelime ekleme.
 * POST body:
 *   { words: [{ word, forbidden[5], categorySlug? }...], defaultCategorySlug?: string }
 * veya doğrudan bir dizi:
 *   [{ word, forbidden[5], categorySlug? }...]
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

  let items: unknown;
  let defaultCategorySlug: string | undefined;
  if (Array.isArray(body)) {
    items = body;
  } else if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    items = b.words;
    if (typeof b.defaultCategorySlug === "string") {
      defaultCategorySlug = b.defaultCategorySlug;
    } else if (typeof b.categorySlug === "string") {
      defaultCategorySlug = b.categorySlug;
    }
  }
  if (!Array.isArray(items)) {
    return NextResponse.json(
      { ok: false, error: "EXPECTED_ARRAY" },
      { status: 400 },
    );
  }
  if (items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "EMPTY_BATCH" },
      { status: 400 },
    );
  }
  if (items.length > 5000) {
    return NextResponse.json(
      { ok: false, error: "TOO_MANY", limit: 5000 },
      { status: 413 },
    );
  }

  const { valid, errors } = validateWords(items, { categorySlug: defaultCategorySlug });

  if (valid.length === 0) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION_FAILED", errors },
      { status: 400 },
    );
  }

  try {
    const slugMap = await getCategorySlugToId(admin);

    const rows: Array<{
      category_id: string;
      word: string;
      forbidden_words: string[];
      difficulty: number;
      language: string;
      is_active: boolean;
    }> = [];
    const unknownCategories = new Set<string>();
    for (const v of valid) {
      const categoryId = slugMap.get(v.categorySlug);
      if (!categoryId) {
        unknownCategories.add(v.categorySlug);
        continue;
      }
      rows.push({
        category_id: categoryId,
        word: v.word,
        forbidden_words: v.forbidden_words,
        difficulty: v.difficulty,
        language: v.language,
        is_active: true,
      });
    }

    let upserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      const { error } = await admin
        .from("words")
        .upsert(chunk, { onConflict: "word,language", ignoreDuplicates: false });
      if (error) {
        return NextResponse.json(
          {
            ok: false,
            error: error.message,
            upserted,
            remaining: rows.length - upserted,
          },
          { status: 500 },
        );
      }
      upserted += chunk.length;
    }

    return NextResponse.json({
      ok: true,
      received: items.length,
      upserted,
      validationErrors: errors,
      unknownCategories: Array.from(unknownCategories),
    });
  } catch (e) {
    const msg = getErrorMessage(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
