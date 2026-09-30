import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireSetupComplete } from "@/lib/auth";
import { assertFacilityOwned } from "@/lib/company";
import { comparisonYears, datasetsForYear, filterByFacility, flattenScope1, sumEmissions } from "@/lib/dashboard";
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
    const rows = filterByFacility(flattenScope1(data.scope1), facilityId);
    const years = Array.from(new Set(rows.map((r) => r.reportingYear))).sort();
    const selectedYear = years.includes(year) ? year : years[years.length - 1] ?? "";
    const current = datasetsForYear(rows, selectedYear);
    const total = sumEmissions(current.map((r) => r.emissions));
    const stationary = sumEmissions(current.filter((r) => r.sourceType === "Stationary").map((r) => r.emissions));
    const mobile = sumEmissions(current.filter((r) => r.sourceType === "Mobile").map((r) => r.emissions));

    const byFuelMap = new Map<string, number | null>();
    for (const row of current) {
      const prev = byFuelMap.get(row.fuelType) ?? null;
      if (row.emissions === null) {
        if (prev === null) byFuelMap.set(row.fuelType, null);
        continue;
      }
      byFuelMap.set(row.fuelType, (prev ?? 0) + row.emissions);
    }
    const byFuel = Array.from(byFuelMap.entries()).map(([fuel, value]) => ({ fuel, value }));
    const ranked = [...byFuel].filter((d) => d.value !== null).sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
    const topFuel = ranked[0]?.fuel ?? "—";

    const byEquipmentMap = new Map<string, number | null>();
    for (const row of current) {
      const prev = byEquipmentMap.get(row.equipmentName) ?? null;
      if (row.emissions === null) {
        if (!byEquipmentMap.has(row.equipmentName)) byEquipmentMap.set(row.equipmentName, null);
        continue;
      }
      byEquipmentMap.set(row.equipmentName, (prev ?? 0) + row.emissions);
    }
    const topEquipment = Array.from(byEquipmentMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value ?? -1) - (a.value ?? -1))
      .slice(0, 5);

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
      yoy = { previousYear: prev, ...percentChange(total, prevTotal) };
    }

    return NextResponse.json({
      hasData: Boolean(selectedYear),
      years,
      selectedYear,
      kpis: {
        total,
        stationary,
        mobile,
        topFuel,
      },
      yoy,
      charts: {
        byFuel,
        stationaryVsMobile: [
          { name: "Stationary", value: stationary },
          { name: "Mobile", value: mobile },
        ],
        topEquipment,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
