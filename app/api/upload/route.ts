import { NextResponse } from "next/server";
import { jsonError, requireSetupComplete } from "@/lib/auth";
import { assertFacilityOwned } from "@/lib/company";
import { datasetExists, saveDataset } from "@/lib/datasets";
import { parseScope1Excel, parseScope2Excel } from "@/lib/excel";
import type { Scope, Scope1Record, Scope2Record } from "@/lib/types";
import { REPORTING_YEARS, reportingYearToCalendarYear } from "@/lib/years";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { session, company } = await requireSetupComplete();
    const form = await request.formData();
    const facilityId = String(form.get("facilityId") ?? "");
    const reportingYear = String(form.get("reportingYear") ?? "");
    const scope = String(form.get("scope") ?? "") as Scope;
    const replace = String(form.get("replace") ?? "") === "true";
    const file = form.get("file");

    if (!facilityId || !reportingYear || (scope !== "Scope1" && scope !== "Scope2")) {
      return NextResponse.json({ error: "Facility, year and scope are required." }, { status: 400 });
    }
    const calendarYear = reportingYearToCalendarYear(reportingYear);
    if (!REPORTING_YEARS.includes(reportingYear) || !calendarYear) {
      return NextResponse.json({ error: "Invalid reporting year." }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "An Excel file is required." }, { status: 400 });
    }

    const facility = assertFacilityOwned(company, facilityId);
    const buffer = Buffer.from(await file.arrayBuffer());

    const parsed =
      scope === "Scope1"
        ? parseScope1Excel(buffer, {
            reportingYear,
            facilityId,
            facilityName: facility.name,
          })
        : parseScope2Excel(buffer, {
            reportingYear,
            facilityId,
            facilityName: facility.name,
          });

    if (!parsed.ok) {
      return NextResponse.json({ error: "Validation failed", errors: parsed.errors }, { status: 400 });
    }

    const exists = await datasetExists({
      companyId: session.companyId,
      facilityId,
      reportingYear,
      scope,
    });

    if (exists && !replace) {
      return NextResponse.json(
        {
          exists: true,
          message: "Data already exists for this facility/year.",
        },
        { status: 409 },
      );
    }

    await saveDataset<Scope1Record | Scope2Record>({
      companyId: session.companyId,
      facilityId,
      facilityName: facility.name,
      reportingYear,
      calendarYear,
      scope,
      records: parsed.records,
      originalFileName: file.name,
      originalBuffer: buffer,
    });

    return NextResponse.json({ ok: true, rows: parsed.records.length, replaced: exists && replace });
  } catch (error) {
    return jsonError(error);
  }
}
