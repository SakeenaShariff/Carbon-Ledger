import * as XLSX from "xlsx";
import { getScope1Factor, getScope2Factor } from "./emissionFactors";
import type { FuelType, Scope1Record, Scope2Record, SourceType } from "./types";
import { reportingYearToCalendarYear } from "./years";

const SCOPE1_HEADERS = [
  "Equipment name",
  "Source type",
  "Fuel type",
  "Quantity consumed",
  "Unit",
] as const;

const SCOPE2_HEADERS = ["Electricity source or meter name", "Electricity consumed (kWh)"] as const;

const SOURCE_TYPES: SourceType[] = ["Stationary", "Mobile"];
const FUEL_TYPES: FuelType[] = ["Diesel", "Petrol", "CNG", "LNG"];

function normalizeHeader(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function cellString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function canonicalMatch<T extends string>(value: string, allowed: readonly T[]): T | null {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  const found = allowed.find((item) => item.toLowerCase() === trimmed.toLowerCase());
  return found ?? null;
}

function parseWorkbook(buffer: Buffer): Record<string, unknown>[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    throw Object.assign(new Error("The file could not be read as an Excel workbook."), { validation: true });
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  });
}

function getField(row: Record<string, unknown>, header: string): unknown {
  const wanted = normalizeHeader(header);
  for (const [key, value] of Object.entries(row)) {
    if (normalizeHeader(key) === wanted) return value;
  }
  return undefined;
}

function validateHeaders(rows: Record<string, unknown>[], required: readonly string[]): string[] {
  if (rows.length === 0) {
    return ["The spreadsheet has no data rows."];
  }
  const keys = Object.keys(rows[0]).map(normalizeHeader);
  const missing = required.filter((header) => !keys.includes(normalizeHeader(header)));
  if (missing.length) {
    return [`Missing required columns: ${missing.join(", ")}.`];
  }
  return [];
}

function parseNonNegativeNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value).trim().replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function excelRowNumber(index: number): number {
  return index + 2;
}

export type ParseResult<T> =
  | { ok: true; records: T[] }
  | { ok: false; errors: string[] };

export function parseScope1Excel(
  buffer: Buffer,
  ctx: { reportingYear: string; facilityId: string; facilityName: string },
): ParseResult<Scope1Record> {
  let rows: Record<string, unknown>[];
  try {
    rows = parseWorkbook(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The file could not be read as an Excel workbook.";
    return { ok: false, errors: [message] };
  }
  const headerErrors = validateHeaders(rows, SCOPE1_HEADERS);
  if (headerErrors.length) return { ok: false, errors: headerErrors };

  const year = reportingYearToCalendarYear(ctx.reportingYear);
  if (!year) return { ok: false, errors: ["Reporting year is invalid. Use FY20–FY26."] };

  const errors: string[] = [];
  const records: Scope1Record[] = [];

  rows.forEach((row, index) => {
    const n = excelRowNumber(index);
    const equipmentName = cellString(getField(row, "Equipment name"));
    const sourceRaw = cellString(getField(row, "Source type"));
    const fuelRaw = cellString(getField(row, "Fuel type"));
    const quantityRaw = getField(row, "Quantity consumed");
    const unit = cellString(getField(row, "Unit"));

    const blankRow = !equipmentName && !sourceRaw && !fuelRaw && cellString(quantityRaw) === "" && !unit;
    if (blankRow) return;

    if (!equipmentName) errors.push(`Row ${n}: Equipment name is blank.`);

    let sourceType: SourceType | null = null;
    if (!sourceRaw) {
      errors.push(`Row ${n}: Source type is blank. Please use Stationary or Mobile.`);
    } else {
      sourceType = canonicalMatch(sourceRaw, SOURCE_TYPES);
      if (!sourceType) {
        errors.push(`Row ${n}: '${sourceRaw}' is not a valid source type. Please use Stationary or Mobile.`);
      }
    }

    let fuelType: FuelType | null = null;
    if (!fuelRaw) {
      errors.push(`Row ${n}: Fuel type is blank. Please use Diesel, Petrol, CNG or LNG.`);
    } else {
      fuelType = canonicalMatch(fuelRaw, FUEL_TYPES);
      if (!fuelType) {
        errors.push(`Row ${n}: '${fuelRaw}' is not supported. Please use Diesel, Petrol, CNG or LNG.`);
      }
    }

    const quantity = parseNonNegativeNumber(quantityRaw);
    if (cellString(quantityRaw) === "") {
      errors.push(`Row ${n}: Quantity consumed is blank.`);
    } else if (quantity === null) {
      errors.push(`Row ${n}: Quantity consumed must be numeric.`);
    } else if (quantity < 0) {
      errors.push(`Row ${n}: Quantity consumed cannot be negative.`);
    }

    if (!unit) errors.push(`Row ${n}: Unit is blank.`);

    if (equipmentName && sourceType && fuelType && quantity !== null && quantity >= 0 && unit) {
      const factor = getScope1Factor(fuelType, year);
      const factorValue = factor?.value ?? null;
      records.push({
        equipmentName,
        sourceType,
        fuelType,
        quantity,
        unit,
        emissionFactor: factorValue,
        emissionFactorUnit: factor?.unit ?? "",
        emissionFactorSource: factor
          ? `${factor.publisher} ${factor.year} — ${factor.document}`
          : "Emission factor unavailable",
        emissions: factorValue === null ? null : quantity * factorValue,
        reportingYear: ctx.reportingYear,
        facilityId: ctx.facilityId,
        facilityName: ctx.facilityName,
      });
    }
  });

  if (errors.length) return { ok: false, errors };
  if (!records.length) return { ok: false, errors: ["The spreadsheet has no valid data rows."] };
  return { ok: true, records };
}

export function parseScope2Excel(
  buffer: Buffer,
  ctx: { reportingYear: string; facilityId: string; facilityName: string },
): ParseResult<Scope2Record> {
  let rows: Record<string, unknown>[];
  try {
    rows = parseWorkbook(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The file could not be read as an Excel workbook.";
    return { ok: false, errors: [message] };
  }
  const headerErrors = validateHeaders(rows, SCOPE2_HEADERS);
  if (headerErrors.length) return { ok: false, errors: headerErrors };

  const year = reportingYearToCalendarYear(ctx.reportingYear);
  if (!year) return { ok: false, errors: ["Reporting year is invalid. Use FY20–FY26."] };

  const errors: string[] = [];
  const records: Scope2Record[] = [];
  const factor = getScope2Factor(year);

  rows.forEach((row, index) => {
    const n = excelRowNumber(index);
    const source = cellString(getField(row, "Electricity source or meter name"));
    const kwhRaw = getField(row, "Electricity consumed (kWh)");
    const blankRow = !source && cellString(kwhRaw) === "";
    if (blankRow) return;

    if (!source) errors.push(`Row ${n}: Electricity source or meter name is blank.`);

    const kWh = parseNonNegativeNumber(kwhRaw);
    if (cellString(kwhRaw) === "") {
      errors.push(`Row ${n}: Electricity consumed (kWh) is blank.`);
    } else if (kWh === null) {
      errors.push(`Row ${n}: Electricity consumed (kWh) must be numeric.`);
    } else if (kWh < 0) {
      errors.push(`Row ${n}: Electricity consumed (kWh) cannot be negative.`);
    }

    if (source && kWh !== null && kWh >= 0) {
      const factorValue = factor?.value ?? null;
      records.push({
        electricitySource: source,
        kWh,
        emissionFactor: factorValue,
        emissionFactorUnit: factor?.unit ?? "",
        emissionFactorSource: factor
          ? `${factor.publisher} ${factor.year} — ${factor.document}`
          : "Emission factor unavailable",
        emissions: factorValue === null ? null : kWh * factorValue,
        reportingYear: ctx.reportingYear,
        facilityId: ctx.facilityId,
        facilityName: ctx.facilityName,
      });
    }
  });

  if (errors.length) return { ok: false, errors };
  if (!records.length) return { ok: false, errors: ["The spreadsheet has no valid data rows."] };
  return { ok: true, records };
}
