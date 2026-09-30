import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireSetupComplete } from "@/lib/auth";
import { assertFacilityOwned } from "@/lib/company";
import { comparisonYears, datasetsForYear, filterByFacility, flattenScope1, flattenScope2, sumEmissions } from "@/lib/dashboard";
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
    const scope1 = filterByFacility(flattenScope1(data.scope1), facilityId);
    const scope2 = filterByFacility(flattenScope2(data.scope2), facilityId);
    const years = Array.from(new Set([...scope1, ...scope2].map((r) => r.reportingYear))).sort();
    const selectedYear = years.includes(year) ? year : years[years.length - 1] ?? "";

    const s1 = datasetsForYear(scope1, selectedYear);
    const s2 = datasetsForYear(scope2, selectedYear);
    const totalScope1 = sumEmissions(s1.map((r) => r.emissions));
    const totalScope2 = sumEmissions(s2.map((r) => r.emissions));
    const total =
      totalScope1 === null && totalScope2 === null
        ? null
        : (totalScope1 ?? 0) + (totalScope2 ?? 0);

    const shareDenom = (totalScope1 ?? 0) + (totalScope2 ?? 0);
    const share = {
      scope1: totalScope1 === null && shareDenom === 0 ? null : shareDenom === 0 ? 0 : ((totalScope1 ?? 0) / shareDenom) * 100,
      scope2: totalScope2 === null && shareDenom === 0 ? null : shareDenom === 0 ? 0 : ((totalScope2 ?? 0) / shareDenom) * 100,
    };

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
      const prevTotal = (() => {
        const a = sumEmissions(datasetsForYear(scope1, prev).map((r) => r.emissions));
        const b = sumEmissions(datasetsForYear(scope2, prev).map((r) => r.emissions));
        if (a === null && b === null) return null;
        return (a ?? 0) + (b ?? 0);
      })();
      const change = percentChange(total, prevTotal);
      yoy = { previousYear: prev, ...change };
    }

    const byYear = years.map((y) => {
      const a = sumEmissions(datasetsForYear(scope1, y).map((r) => r.emissions));
      const b = sumEmissions(datasetsForYear(scope2, y).map((r) => r.emissions));
      return {
        year: y,
        scope1: a,
        scope2: b,
        total: a === null && b === null ? null : (a ?? 0) + (b ?? 0),
      };
    });

    const facilityIds = facilityId === "all" ? data.facilities : data.facilities.filter((f) => f.id === facilityId);
    const byFacility = facilityIds.map((f) => {
      const a = sumEmissions(datasetsForYear(scope1.filter((r) => r.facilityId === f.id), selectedYear).map((r) => r.emissions));
      const b = sumEmissions(datasetsForYear(scope2.filter((r) => r.facilityId === f.id), selectedYear).map((r) => r.emissions));
      return {
        facility: f.name,
        scope1: a,
        scope2: b,
        total: a === null && b === null ? null : (a ?? 0) + (b ?? 0),
      };
    });

    return NextResponse.json({
      hasData: Boolean(selectedYear),
      years,
      selectedYear,
      kpis: {
        total,
        scope1: totalScope1,
        scope2: totalScope2,
        share,
      },
      yoy,
      charts: {
        split: [
          { name: "Scope 1", value: totalScope1 },
          { name: "Scope 2", value: totalScope2 },
        ],
        byYear,
        byFacility,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
