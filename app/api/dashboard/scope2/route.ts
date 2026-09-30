import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireSetupComplete } from "@/lib/auth";
import { assertFacilityOwned } from "@/lib/company";
import { comparisonYears, datasetsForYear, filterByFacility, flattenScope2, sumEmissions } from "@/lib/dashboard";
import { listCompanyDatasets } from "@/lib/datasets";
import { percentChange } from "@/lib/metrics";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { company } = await requireSetupComplete();
    const facilityId = request.nextUrl.searchParams.get("facilityId") ?? "all";
    const year = request.nextUrl.searchParams.get("year") ?? "";
    if (facilityId !== "all") assertFacilityOwned(company, facilityId);

    const data = await listCompanyDatasets(company);
    const rows = filterByFacility(flattenScope2(data.scope2), facilityId);
    const years = Array.from(new Set(rows.map((r) => r.reportingYear))).sort();
    const selectedYear = years.includes(year) ? year : years[years.length - 1] ?? "";
    const current = datasetsForYear(rows, selectedYear);
    const totalKwh = current.reduce((sum, r) => sum + r.kWh, 0);
    const totalEmissions = sumEmissions(current.map((r) => r.emissions));

    const prev = comparisonYears(selectedYear, years).previous;
    let yoy: {
      previousYear: string | null;
      absolute: number | null;
      percent: number | null;
      message?: string;
    } = { previousYear: prev, absolute: null, percent: null };
    if (!selectedYear) {
      yoy = { previousYear: null, absolute: null, percent: null };
    } else if (!prev) {
      yoy = { previousYear: null, absolute: null, percent: null, message: "No previous-year data available." };
    } else {
      const prevTotal = sumEmissions(datasetsForYear(rows, prev).map((r) => r.emissions));
      yoy = { previousYear: prev, ...percentChange(totalEmissions, prevTotal) };
    }

    const facilityIds = facilityId === "all" ? data.facilities : data.facilities.filter((f) => f.id === facilityId);
    const byFacility = facilityIds.map((f) => {
      const subset = current.filter((r) => r.facilityId === f.id);
      return {
        facility: f.name,
        kWh: subset.reduce((sum, r) => sum + r.kWh, 0),
        emissions: sumEmissions(subset.map((r) => r.emissions)),
      };
    });

    const byYear = years.map((y) => ({
      year: y,
      emissions: sumEmissions(datasetsForYear(rows, y).map((r) => r.emissions)),
      kWh: datasetsForYear(rows, y).reduce((sum, r) => sum + r.kWh, 0),
    }));

    return NextResponse.json({
      hasData: Boolean(selectedYear),
      years,
      selectedYear,
      kpis: {
        totalKwh: current.length ? totalKwh : null,
        totalEmissions,
      },
      yoy,
      charts: {
        emissionsByFacility: byFacility,
        kwhByFacility: byFacility,
        emissionsByYear: byYear,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
