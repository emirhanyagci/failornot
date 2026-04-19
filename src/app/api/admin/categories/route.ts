import { NextResponse } from "next/server";
import { requireAdminOr401 } from "@/lib/admin/guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureCategories } from "@/lib/admin/categories";

export const runtime = "nodejs";

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message?: unknown }).message ?? "UNKNOWN");
  }
  return "UNKNOWN";
}

export async function GET() {
  const unauth = await requireAdminOr401();
  if (unauth) return unauth;
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }
  try {
    const rows = await ensureCategories(admin);
    // `karisik` meta-kategorisini kelime eklemek için göstermiyoruz.
    const usable = rows.filter((r) => r.slug !== "karisik");
    return NextResponse.json({ ok: true, categories: usable });
  } catch (e) {
    const msg = getErrorMessage(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
