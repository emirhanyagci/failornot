import { NextResponse } from "next/server";
import { isLoggedIn } from "./auth";

/**
 * API route'larda çağrılacak yardımcı. Giriş yoksa 401 döner.
 * Kullanım:
 *   const unauth = await requireAdminOr401();
 *   if (unauth) return unauth;
 */
export async function requireAdminOr401(): Promise<NextResponse | null> {
  const ok = await isLoggedIn();
  if (ok) return null;
  return NextResponse.json(
    { ok: false, error: "UNAUTHORIZED" },
    { status: 401 },
  );
}
