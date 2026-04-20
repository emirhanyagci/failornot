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
 * Öneriyi onayla veya reddet.
 *
 * PATCH body:
 *  - { action: "reject" }
 *  - { action: "approve", word, forbidden[5], categorySlug, difficulty?, language? }
 *
 * "approve" yaparken admin, önerideki 3+ yasak kelimeyi 5'e tamamlamış olmalı.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauth = await requireAdminOr401();
  if (unauth) return unauth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const action = body.action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ ok: false, error: "INVALID_ACTION" }, { status: 400 });
  }

  const { data: suggestion, error: fetchErr } = await admin
    .from("word_suggestions")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) {
    return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });
  }
  if (!suggestion) {
    return NextResponse.json(
      { ok: false, error: "SUGGESTION_NOT_FOUND" },
      { status: 404 },
    );
  }
  if (suggestion.status !== "pending") {
    return NextResponse.json(
      { ok: false, error: "ALREADY_REVIEWED", status: suggestion.status },
      { status: 409 },
    );
  }

  if (action === "reject") {
    const { error } = await admin
      .from("word_suggestions")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // action === "approve"
  const { valid, errors } = validateWords({
    word: body.word,
    forbidden: body.forbidden,
    categorySlug: body.categorySlug,
    difficulty: body.difficulty,
    language: body.language,
  });
  if (valid.length === 0) {
    return NextResponse.json(
      { ok: false, error: errors[0]?.reason ?? "VALIDATION_FAILED", errors },
      { status: 400 },
    );
  }

  const row = valid[0];

  try {
    const slugMap = await getCategorySlugToId(admin);
    const categoryId = slugMap.get(row.categorySlug);
    if (!categoryId) {
      return NextResponse.json(
        { ok: false, error: "UNKNOWN_CATEGORY", categorySlug: row.categorySlug },
        { status: 400 },
      );
    }

    const { data: existing, error: existingError } = await admin
      .from("words")
      .select("id")
      .eq("word", row.word)
      .eq("language", row.language)
      .maybeSingle();
    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 },
      );
    }
    if (existing) {
      // Zaten mevcut kelime: öneriyi yine de onaylanmış say (işlenmiş).
      const { error: updateErr } = await admin
        .from("word_suggestions")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (updateErr) {
        return NextResponse.json(
          { ok: false, error: updateErr.message },
          { status: 500 },
        );
      }
      return NextResponse.json({ ok: true, existed: true });
    }

    const { error: insertErr } = await admin.from("words").insert({
      category_id: categoryId,
      word: row.word,
      forbidden_words: row.forbidden_words,
      difficulty: row.difficulty,
      language: row.language,
      is_active: true,
    });
    if (insertErr) {
      if (
        typeof (insertErr as { code?: string }).code === "string" &&
        (insertErr as { code: string }).code === "23505"
      ) {
        // Yarışma durumu: paralel istek araya girmiş olabilir. Yine de
        // öneriyi onaylanmış olarak işaretleyelim.
      } else {
        return NextResponse.json(
          { ok: false, error: insertErr.message },
          { status: 500 },
        );
      }
    }

    const { error: updateErr } = await admin
      .from("word_suggestions")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (updateErr) {
      return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(e) },
      { status: 500 },
    );
  }
}

/**
 * Bir öneriyi tamamen sil (hem pending hem de arşivlenmişleri temizlemek için).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauth = await requireAdminOr401();
  if (unauth) return unauth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const { error } = await admin.from("word_suggestions").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: "DELETE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
