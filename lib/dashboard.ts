import type { LoadedScope1, LoadedScope2 } from "@/lib/datasets";
import { previousYear, sumEmissions } from "@/lib/metrics";

export function filterByFacility<T extends { facilityId: string }>(rows: T[], facilityId: string | null): T[] {
  if (!facilityId || facilityId === "all") return rows;
  return rows.filter((row) => row.facilityId === facilityId);
}

export function datasetsForYear<T extends { reportingYear: string }>(rows: T[], year: string): T[] {
  return rows.filter((row) => row.reportingYear === year);
}

export function flattenScope1(sets: LoadedScope1[]) {
  return sets.flatMap((set) => set.records);
}

export function flattenScope2(sets: LoadedScope2[]) {
  return sets.flatMap((set) => set.records);
}

export function comparisonYears(selected: string, years: string[]) {
  return { previous: previousYear(selected, years) };
}

export { sumEmissions };
