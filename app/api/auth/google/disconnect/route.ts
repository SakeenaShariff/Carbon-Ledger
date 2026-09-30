import { NextResponse } from "next/server";
import { clearGoogleTokensCookie } from "@/lib/oauth";

export const runtime = "nodejs";

export async function POST() {
  await clearGoogleTokensCookie();
  return NextResponse.json({ ok: true });
}
