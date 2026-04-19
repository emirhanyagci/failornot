import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  verifyCredentials,
} from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_BODY" },
      { status: 400 },
    );
  }
  const { username, password } =
    (body ?? {}) as { username?: string; password?: string };

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { ok: false, error: "MISSING_FIELDS" },
      { status: 400 },
    );
  }

  if (!verifyCredentials(username, password)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_CREDENTIALS" },
      { status: 401 },
    );
  }

  const token = createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
