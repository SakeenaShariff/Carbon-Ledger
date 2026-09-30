import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, setGoogleTokensCookie } from "@/lib/oauth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  let returnTo = "/dashboard";
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      if (decoded.returnTo && typeof decoded.returnTo === "string") {
        returnTo = decoded.returnTo;
      }
    } catch {
      // default returnTo
    }
  }

  const redirectBase = new URL(returnTo, request.url);

  if (error) {
    redirectBase.searchParams.set("error", `Google authorization was denied or failed: ${error}`);
    return NextResponse.redirect(redirectBase);
  }

  if (!code) {
    redirectBase.searchParams.set("error", "No authorization code was returned from Google.");
    return NextResponse.redirect(redirectBase);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await setGoogleTokensCookie(tokens);

    redirectBase.searchParams.set("connected", "true");
    return NextResponse.redirect(redirectBase);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to exchange Google authorization code.";
    redirectBase.searchParams.set("error", message);
    return NextResponse.redirect(redirectBase);
  }
}
