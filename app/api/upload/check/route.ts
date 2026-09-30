import { NextResponse } from "next/server";
import { jsonError, requireSetupComplete } from "@/lib/auth";
import { assertFacilityOwned } from "@/lib/company";
import { datasetExists } from "@/lib/datasets";
import type { Scope } from "@/lib/types";
import { REPORTING_YEARS, reportingYearToCalendarYear } from "@/lib/years";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { session, company } = await requireSetupComplete();
    const body = (await request.json()) as {
      facilityId?: string;
      reportingYear?: string;
      scope?: Scope;
    };
    const facilityId = body.facilityId ?? "";
    const reportingYear = body.reportingYear ?? "";
    const scope = body.scope;
    if (!facilityId || !reportingYear || (scope !== "Scope1" && scope !== "Scope2")) {
      return NextResponse.json({ error: "Facility, year and scope are required." }, { status: 400 });
    }
    if (!REPORTING_YEARS.includes(reportingYear) || !reportingYearToCalendarYear(reportingYear)) {
      return NextResponse.json({ error: "Invalid reporting year." }, { status: 400 });
    }
    assertFacilityOwned(company, facilityId);
    const exists = await datasetExists({
      companyId: session.companyId,
      facilityId,
      reportingYear,
      scope,
    });
    return NextResponse.json({ exists });
  } catch (error) {
    return jsonError(error);
  }
}
