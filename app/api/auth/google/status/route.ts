import { NextResponse } from "next/server";
import { getGoogleTokens } from "@/lib/oauth";
import { getRootFolderId } from "@/lib/drive";

export const runtime = "nodejs";

export async function GET() {
  try {
    const tokens = await getGoogleTokens();
    const isConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const connected = Boolean(tokens && (tokens.refresh_token || tokens.access_token));

    return NextResponse.json({
      configured: isConfigured,
      connected,
      email: tokens?.email ?? null,
      folderId: getRootFolderId(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        connected: false,
        error: error instanceof Error ? error.message : "Failed to check Google Drive status",
      },
      { status: 500 },
    );
  }
}
