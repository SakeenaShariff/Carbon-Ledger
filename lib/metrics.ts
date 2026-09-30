export function sumEmissions(values: Array<number | null | undefined>): number | null {
  const numbers = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!numbers.length) return null;
  return numbers.reduce((sum, n) => sum + n, 0);
}

export function formatTco2e(value: number | null): string {
  if (value === null) return "Emission factor unavailable";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO2e`;
}

export function formatNumber(value: number | null, suffix = ""): string {
  if (value === null) return "Emission factor unavailable";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
}

export function percentChange(current: number | null, previous: number | null): {
  absolute: number | null;
  percent: number | null;
} {
  if (current === null || previous === null) return { absolute: null, percent: null };
  const absolute = current - previous;
  if (previous === 0) return { absolute, percent: null };
  return { absolute, percent: (absolute / previous) * 100 };
}

export function previousYear(selected: string, available: string[]): string | null {
  const sorted = [...available].sort();
  const index = sorted.indexOf(selected);
  if (index <= 0) return null;
  return sorted[index - 1];
}
