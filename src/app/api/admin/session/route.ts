import { NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function GET() {
  const ok = await isLoggedIn();
  return NextResponse.json({ loggedIn: ok });
}
