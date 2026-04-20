import { NextResponse } from "next/server";
import { requireAdminOr401 } from "@/lib/admin/guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message?: unknown }).message ?? "UNKNOWN");
  }
  return "UNKNOWN";
}

/**
 * Kullanıcılardan gelen kelime önerilerini listele.
 * GET /api/admin/suggestions?status=pending&page=1&limit=50
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
  const statusParam = url.searchParams.get("status") ?? "pending";
  const status = ["pending", "approved", "rejected", "all"].includes(statusParam)
    ? statusParam
    : "pending";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("limit") ?? "50") || 50),
  );
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = admin
      .from("word_suggestions")
      .select(
        "id, word, forbidden_words, category_slug, language, submitted_by, status, reviewed_at, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      suggestions: data ?? [],
      total: count ?? 0,
      page,
      limit,
      status,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(e) },
      { status: 500 },
    );
  }
}
