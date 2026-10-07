import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/auth";
import {
  fetchEmissionFactorsFromGoogleSheet,
  findEmissionFactorFromMaster,
  getOrCreateMasterSheetId,
  MASTER_SHEET_NAME,
} from "@/lib/emissionFactors";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const activity = searchParams.get("activity");
    const year = searchParams.get("year");
    const source = searchParams.get("source");
    const region = searchParams.get("region");
    const refresh = searchParams.get("refresh") === "true";

    const allFactors = await fetchEmissionFactorsFromGoogleSheet(refresh);
    const sheetId = await getOrCreateMasterSheetId();

    if (activity && year) {
      const matched = await findEmissionFactorFromMaster({
        scope: (scope ?? "Scope 1") as "Scope 1" | "Scope 2",
        activity,
        year: parseInt(year, 10),
        source: source ?? undefined,
        region: region ?? undefined,
      });

      return NextResponse.json({
        matched,
        sheetInfo: {
          name: MASTER_SHEET_NAME,
          id: sheetId,
        },
      });
    }

    // Return summary and list of available factors
    const sources = Array.from(new Set(allFactors.map((f) => f.source))).sort();
    const years = Array.from(new Set(allFactors.map((f) => f.year))).sort((a, b) => a - b);
    const activities = Array.from(new Set(allFactors.map((f) => f.activity))).sort();

    return NextResponse.json({
      sheetInfo: {
        name: MASTER_SHEET_NAME,
        id: sheetId,
        totalRecords: allFactors.length,
        supportedSources: sources,
        supportedYears: years,
        supportedActivities: activities,
      },
      factors: allFactors,
    });
  } catch (error) {
    return jsonError(error);
  }
}
