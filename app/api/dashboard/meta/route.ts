import { NextResponse } from "next/server";
import { jsonError, requireSetupComplete } from "@/lib/auth";
import { listCompanyDatasets } from "@/lib/datasets";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { company } = await requireSetupComplete();
    const data = await listCompanyDatasets(company);
    return NextResponse.json({
      facilities: [{ id: "all", name: "All Facilities" }, ...data.facilities],
      years: data.years,
      hasData: data.scope1.length + data.scope2.length > 0,
    });
  } catch (error) {
    return jsonError(error);
  }
}
