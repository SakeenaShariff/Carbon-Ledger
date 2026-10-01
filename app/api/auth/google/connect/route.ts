import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/dashboard";
  const url = new URL(returnTo, request.url);
  return NextResponse.redirect(url);
}
