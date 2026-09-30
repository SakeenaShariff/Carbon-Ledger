export function reportingYearToCalendarYear(reportingYear: string): number | null {
  const match = reportingYear.trim().toUpperCase().match(/^FY(\d{2})$/);
  if (!match) return null;
  const yy = Number(match[1]);
  return 2000 + yy;
}

export function calendarYearToReportingYear(year: number): string {
  return `FY${String(year).slice(-2)}`;
}

export const REPORTING_YEARS = ["FY20", "FY21", "FY22", "FY23", "FY24", "FY25", "FY26"];
