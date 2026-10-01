import { NextResponse } from "next/server";
import { getRootFolderId, isDriveConfigured } from "@/lib/drive";

export const runtime = "nodejs";

export async function GET() {
  try {
    const configured = isDriveConfigured();

    return NextResponse.json({
      configured,
      connected: configured,
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
