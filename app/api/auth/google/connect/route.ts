import { NextRequest, NextResponse } from "next/server";
import { generateGoogleAuthUrl } from "@/lib/oauth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const returnTo = request.nextUrl.searchParams.get("returnTo") || "/dashboard";
    const authUrl = generateGoogleAuthUrl(returnTo);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initiate Google authorization.";
    const url = new URL("/login", request.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}
