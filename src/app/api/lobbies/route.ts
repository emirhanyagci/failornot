import { NextResponse } from "next/server";
import { getPartyHttpBase } from "@/lib/partykit/config";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${getPartyHttpBase()}/parties/lobbies/index`, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ lobbies: [] }, { status: 200 });
    }

    const json = (await res.json().catch(() => ({}))) as {
      lobbies?: unknown[];
    };
    return NextResponse.json({ lobbies: json.lobbies ?? [] });
  } catch {
    return NextResponse.json({ lobbies: [] }, { status: 200 });
  }
}
