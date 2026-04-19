import { NextResponse } from "next/server";
import { requireAdminOr401 } from "@/lib/admin/guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getCategorySlugToId } from "@/lib/admin/categories";
import { validateWords } from "@/lib/admin/words";

export const runtime = "nodejs";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const { valid, errors } = validateWords(body);
  if (valid.length === 0) {
    return NextResponse.json(
      { ok: false, error: errors[0]?.reason ?? "VALIDATION_FAILED", errors },
      { status: 400 },
    );
  }

  const { id } = await params;
  const row = valid[0];

  const slugMap = await getCategorySlugToId(admin);
  const categoryId = slugMap.get(row.categorySlug);
  if (!categoryId) {
    return NextResponse.json({ ok: false, error: "UNKNOWN_CATEGORY" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  const { data, error } = await admin
    .from("words")
    .update({
      word: row.word,
      forbidden_words: row.forbidden_words,
      category_id: categoryId,
      difficulty: row.difficulty,
      language: row.language,
      is_active: typeof payload.is_active === "boolean" ? payload.is_active : true,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "WORD_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

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
  const { error } = await admin.from("words").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: "DELETE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
