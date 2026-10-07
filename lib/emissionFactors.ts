import { Readable } from "stream";
import { findChild, getRootFolderId, isDriveConfigured } from "./drive";
import { google } from "googleapis";
import type { EmissionFactor, FuelType, Scope } from "./types";

export type EmissionFactorMasterRow = {
  source: string;
  year: number;
  scope: "Scope 1" | "Scope 2" | "Scope1" | "Scope2";
  activity: string;
  unit: string;
  emissionFactor: number;
  emissionFactorUnit: string;
  ghgGas: string;
  region: string;
  notes: string;
  reference: string;
};

export const MASTER_SHEET_NAME = "Emission Factor Master Dataset";

// Master dataset seed containing multiple sources (DEFRA, CA, CEA, etc.) and multiple years (2020-2026+)
export const MASTER_DATASET_SEED: EmissionFactorMasterRow[] = [
  // --- DEFRA (UK Government / DESNZ) Scope 1 Fuels (2020-2026) ---
  {
    source: "DEFRA",
    year: 2024,
    scope: "Scope 1",
    activity: "Diesel",
    unit: "litre",
    emissionFactor: 2.54016 / 1000,
    emissionFactorUnit: "tCO2e / litre",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "UK / Global",
    notes: "Average biofuel blend (UK standard)",
    reference: "UK Government GHG Conversion Factors for Company Reporting 2024",
  },
  {
    source: "DEFRA",
    year: 2025,
    scope: "Scope 1",
    activity: "Diesel",
    unit: "litre",
    emissionFactor: 2.54016 / 1000,
    emissionFactorUnit: "tCO2e / litre",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "UK / Global",
    notes: "Average biofuel blend (UK standard)",
    reference: "UK Government GHG Conversion Factors for Company Reporting 2025",
  },
  {
    source: "DEFRA",
    year: 2026,
    scope: "Scope 1",
    activity: "Diesel",
    unit: "litre",
    emissionFactor: 2.54016 / 1000,
    emissionFactorUnit: "tCO2e / litre",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "UK / Global",
    notes: "Average biofuel blend (UK standard)",
    reference: "UK Government GHG Conversion Factors for Company Reporting 2026",
  },
  {
    source: "DEFRA",
    year: 2024,
    scope: "Scope 1",
    activity: "Petrol",
    unit: "litre",
    emissionFactor: 2.06916 / 1000,
    emissionFactorUnit: "tCO2e / litre",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "UK / Global",
    notes: "Average biofuel blend (UK standard)",
    reference: "UK Government GHG Conversion Factors for Company Reporting 2024",
  },
  {
    source: "DEFRA",
    year: 2025,
    scope: "Scope 1",
    activity: "Petrol",
    unit: "litre",
    emissionFactor: 2.06916 / 1000,
    emissionFactorUnit: "tCO2e / litre",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "UK / Global",
    notes: "Average biofuel blend (UK standard)",
    reference: "UK Government GHG Conversion Factors for Company Reporting 2025",
  },
  {
    source: "DEFRA",
    year: 2026,
    scope: "Scope 1",
    activity: "Petrol",
    unit: "litre",
    emissionFactor: 2.06916 / 1000,
    emissionFactorUnit: "tCO2e / litre",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "UK / Global",
    notes: "Average biofuel blend (UK standard)",
    reference: "UK Government GHG Conversion Factors for Company Reporting 2026",
  },
  {
    source: "DEFRA",
    year: 2024,
    scope: "Scope 1",
    activity: "CNG",
    unit: "kg",
    emissionFactor: 2575.46441 / 1000000,
    emissionFactorUnit: "tCO2e / kg",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "UK / Global",
    notes: "100% Compressed Natural Gas",
    reference: "UK Government GHG Conversion Factors for Company Reporting 2024",
  },
  {
    source: "DEFRA",
    year: 2025,
    scope: "Scope 1",
    activity: "CNG",
    unit: "kg",
    emissionFactor: 2575.46441 / 1000000,
    emissionFactorUnit: "tCO2e / kg",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "UK / Global",
    notes: "100% Compressed Natural Gas",
    reference: "UK Government GHG Conversion Factors for Company Reporting 2025",
  },
  {
    source: "DEFRA",
    year: 2026,
    scope: "Scope 1",
    activity: "CNG",
    unit: "kg",
    emissionFactor: 2575.46441 / 1000000,
    emissionFactorUnit: "tCO2e / kg",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "UK / Global",
    notes: "100% Compressed Natural Gas",
    reference: "UK Government GHG Conversion Factors for Company Reporting 2026",
  },
  {
    source: "DEFRA",
    year: 2024,
    scope: "Scope 1",
    activity: "LNG",
    unit: "kg",
    emissionFactor: 2603.30441 / 1000000,
    emissionFactorUnit: "tCO2e / kg",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "UK / Global",
    notes: "100% Liquefied Natural Gas",
    reference: "UK Government GHG Conversion Factors for Company Reporting 2024",
  },
  {
    source: "DEFRA",
    year: 2025,
    scope: "Scope 1",
    activity: "LNG",
    unit: "kg",
    emissionFactor: 2603.30441 / 1000000,
    emissionFactorUnit: "tCO2e / kg",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "UK / Global",
    notes: "100% Liquefied Natural Gas",
    reference: "UK Government GHG Conversion Factors for Company Reporting 2025",
  },
  {
    source: "DEFRA",
    year: 2026,
    scope: "Scope 1",
    activity: "LNG",
    unit: "kg",
    emissionFactor: 2603.30441 / 1000000,
    emissionFactorUnit: "tCO2e / kg",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "UK / Global",
    notes: "100% Liquefied Natural Gas",
    reference: "UK Government GHG Conversion Factors for Company Reporting 2026",
  },

  // --- CA (California Air Resources Board - CARB / Climate Action Reserve) (2024-2026) ---
  {
    source: "CA",
    year: 2024,
    scope: "Scope 1",
    activity: "Diesel",
    unit: "litre",
    emissionFactor: 0.0026896,
    emissionFactorUnit: "tCO2e / litre",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CARB Standard Ultra-Low Sulfur Diesel",
    reference: "California Air Resources Board Mandatory GHG Reporting (MRR 2024)",
  },
  {
    source: "CA",
    year: 2025,
    scope: "Scope 1",
    activity: "Diesel",
    unit: "litre",
    emissionFactor: 0.0026896,
    emissionFactorUnit: "tCO2e / litre",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CARB Standard Ultra-Low Sulfur Diesel",
    reference: "California Air Resources Board Mandatory GHG Reporting (MRR 2025)",
  },
  {
    source: "CA",
    year: 2026,
    scope: "Scope 1",
    activity: "Diesel",
    unit: "litre",
    emissionFactor: 0.0026896,
    emissionFactorUnit: "tCO2e / litre",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CARB Standard Ultra-Low Sulfur Diesel",
    reference: "California Air Resources Board Mandatory GHG Reporting (MRR 2026)",
  },
  {
    source: "CA",
    year: 2024,
    scope: "Scope 1",
    activity: "Petrol",
    unit: "litre",
    emissionFactor: 0.0023223,
    emissionFactorUnit: "tCO2e / litre",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CARB Reformulated Gasoline (CaRFG3)",
    reference: "California Air Resources Board Mandatory GHG Reporting (MRR 2024)",
  },
  {
    source: "CA",
    year: 2025,
    scope: "Scope 1",
    activity: "Petrol",
    unit: "litre",
    emissionFactor: 0.0023223,
    emissionFactorUnit: "tCO2e / litre",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CARB Reformulated Gasoline (CaRFG3)",
    reference: "California Air Resources Board Mandatory GHG Reporting (MRR 2025)",
  },
  {
    source: "CA",
    year: 2026,
    scope: "Scope 1",
    activity: "Petrol",
    unit: "litre",
    emissionFactor: 0.0023223,
    emissionFactorUnit: "tCO2e / litre",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CARB Reformulated Gasoline (CaRFG3)",
    reference: "California Air Resources Board Mandatory GHG Reporting (MRR 2026)",
  },
  {
    source: "CA",
    year: 2024,
    scope: "Scope 1",
    activity: "CNG",
    unit: "kg",
    emissionFactor: 0.00275,
    emissionFactorUnit: "tCO2e / kg",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CARB Compressed Natural Gas Specification",
    reference: "California Air Resources Board Mandatory GHG Reporting (MRR 2024)",
  },
  {
    source: "CA",
    year: 2025,
    scope: "Scope 1",
    activity: "CNG",
    unit: "kg",
    emissionFactor: 0.00275,
    emissionFactorUnit: "tCO2e / kg",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CARB Compressed Natural Gas Specification",
    reference: "California Air Resources Board Mandatory GHG Reporting (MRR 2025)",
  },
  {
    source: "CA",
    year: 2026,
    scope: "Scope 1",
    activity: "CNG",
    unit: "kg",
    emissionFactor: 0.00275,
    emissionFactorUnit: "tCO2e / kg",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CARB Compressed Natural Gas Specification",
    reference: "California Air Resources Board Mandatory GHG Reporting (MRR 2026)",
  },
  {
    source: "CA",
    year: 2024,
    scope: "Scope 1",
    activity: "LNG",
    unit: "kg",
    emissionFactor: 0.00278,
    emissionFactorUnit: "tCO2e / kg",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CARB Liquefied Natural Gas Specification",
    reference: "California Air Resources Board Mandatory GHG Reporting (MRR 2024)",
  },
  {
    source: "CA",
    year: 2025,
    scope: "Scope 1",
    activity: "LNG",
    unit: "kg",
    emissionFactor: 0.00278,
    emissionFactorUnit: "tCO2e / kg",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CARB Liquefied Natural Gas Specification",
    reference: "California Air Resources Board Mandatory GHG Reporting (MRR 2025)",
  },
  {
    source: "CA",
    year: 2026,
    scope: "Scope 1",
    activity: "LNG",
    unit: "kg",
    emissionFactor: 0.00278,
    emissionFactorUnit: "tCO2e / kg",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CARB Liquefied Natural Gas Specification",
    reference: "California Air Resources Board Mandatory GHG Reporting (MRR 2026)",
  },
  {
    source: "CA",
    year: 2024,
    scope: "Scope 2",
    activity: "Electricity",
    unit: "kWh",
    emissionFactor: 0.000214,
    emissionFactorUnit: "tCO2e / kWh",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CAMX California Grid Average Subregion",
    reference: "US EPA eGRID / California Air Resources Board (2024)",
  },
  {
    source: "CA",
    year: 2025,
    scope: "Scope 2",
    activity: "Electricity",
    unit: "kWh",
    emissionFactor: 0.000208,
    emissionFactorUnit: "tCO2e / kWh",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CAMX California Grid Average Subregion",
    reference: "US EPA eGRID / California Air Resources Board (2025)",
  },
  {
    source: "CA",
    year: 2026,
    scope: "Scope 2",
    activity: "Electricity",
    unit: "kWh",
    emissionFactor: 0.0002,
    emissionFactorUnit: "tCO2e / kWh",
    ghgGas: "All GHGs (CO2, CH4, N2O)",
    region: "California",
    notes: "CAMX California Grid Average Subregion",
    reference: "US EPA eGRID / California Air Resources Board (2026)",
  },

  // --- CEA (Central Electricity Authority India) Scope 2 Electricity (2020-2026) ---
  {
    source: "CEA",
    year: 2020,
    scope: "Scope 2",
    activity: "Electricity",
    unit: "kWh",
    emissionFactor: 0.713 / 1000,
    emissionFactorUnit: "tCO2e / kWh",
    ghgGas: "CO2",
    region: "India",
    notes: "National Grid Weighted Average Margin (FY20)",
    reference: "CO2 Baseline Database for the Indian Power Sector (v21.0)",
  },
  {
    source: "CEA",
    year: 2021,
    scope: "Scope 2",
    activity: "Electricity",
    unit: "kWh",
    emissionFactor: 0.703 / 1000,
    emissionFactorUnit: "tCO2e / kWh",
    ghgGas: "CO2",
    region: "India",
    notes: "National Grid Weighted Average Margin (FY21)",
    reference: "CO2 Baseline Database for the Indian Power Sector (v21.0)",
  },
  {
    source: "CEA",
    year: 2022,
    scope: "Scope 2",
    activity: "Electricity",
    unit: "kWh",
    emissionFactor: 0.715 / 1000,
    emissionFactorUnit: "tCO2e / kWh",
    ghgGas: "CO2",
    region: "India",
    notes: "National Grid Weighted Average Margin (FY22)",
    reference: "CO2 Baseline Database for the Indian Power Sector (v21.0)",
  },
  {
    source: "CEA",
    year: 2023,
    scope: "Scope 2",
    activity: "Electricity",
    unit: "kWh",
    emissionFactor: 0.716 / 1000,
    emissionFactorUnit: "tCO2e / kWh",
    ghgGas: "CO2",
    region: "India",
    notes: "National Grid Weighted Average Margin (FY23)",
    reference: "CO2 Baseline Database for the Indian Power Sector (v21.0)",
  },
  {
    source: "CEA",
    year: 2024,
    scope: "Scope 2",
    activity: "Electricity",
    unit: "kWh",
    emissionFactor: 0.727 / 1000,
    emissionFactorUnit: "tCO2e / kWh",
    ghgGas: "CO2",
    region: "India",
    notes: "National Grid Weighted Average Margin (FY24)",
    reference: "CO2 Baseline Database for the Indian Power Sector (v21.0)",
  },
  {
    source: "CEA",
    year: 2025,
    scope: "Scope 2",
    activity: "Electricity",
    unit: "kWh",
    emissionFactor: 0.71 / 1000,
    emissionFactorUnit: "tCO2e / kWh",
    ghgGas: "CO2",
    region: "India",
    notes: "National Grid Weighted Average Margin (FY25)",
    reference: "CO2 Baseline Database for the Indian Power Sector (v21.0)",
  },
  {
    source: "CEA",
    year: 2026,
    scope: "Scope 2",
    activity: "Electricity",
    unit: "kWh",
    emissionFactor: 0.71 / 1000,
    emissionFactorUnit: "tCO2e / kWh",
    ghgGas: "CO2",
    region: "India",
    notes: "National Grid Weighted Average Margin (FY26)",
    reference: "CO2 Baseline Database for the Indian Power Sector (v21.0)",
  },
];

export const FUEL_TYPES: FuelType[] = ["Diesel", "Petrol", "CNG", "LNG"];

// In-memory cache for emission factor rows fetched from Google Sheets
let cachedMasterRows: EmissionFactorMasterRow[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

function getDriveClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: "v3", auth: oauth2Client });
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;
  if (email && privateKey) {
    const jwt = new google.auth.JWT({
      email,
      key: privateKey.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    return google.drive({ version: "v3", auth: jwt });
  }

  return null;
}

function parseCsv(csvText: string): EmissionFactorMasterRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine).map((h) => h.trim().toLowerCase());

  const getIdx = (candidates: string[]): number => {
    return headers.findIndex((h) => candidates.some((c) => h === c.toLowerCase() || h.includes(c.toLowerCase())));
  };

  const sourceIdx = getIdx(["source"]);
  const yearIdx = getIdx(["year"]);
  const scopeIdx = getIdx(["scope"]);
  const activityIdx = getIdx(["activity / fuel type", "activity", "fuel type", "fuel"]);
  const unitIdx = getIdx(["unit"]);
  const factorIdx = getIdx(["emission factor", "factor", "value"]);
  const factorUnitIdx = getIdx(["emission factor unit", "factor unit"]);
  const ghgIdx = getIdx(["ghg / gas", "ghg", "gas"]);
  const regionIdx = getIdx(["geography / region", "geography", "region", "country"]);
  const notesIdx = getIdx(["notes", "note", "description"]);
  const refIdx = getIdx(["reference / evidence", "reference", "evidence", "document", "source document"]);

  const rows: EmissionFactorMasterRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (!cols.length || cols.every((c) => !c.trim())) continue;

    const source = (sourceIdx >= 0 ? cols[sourceIdx] : "")?.trim() || "Standard";
    const yearStr = (yearIdx >= 0 ? cols[yearIdx] : "")?.trim();
    const year = parseInt(yearStr, 10);
    const scopeRaw = (scopeIdx >= 0 ? cols[scopeIdx] : "")?.trim() || "Scope 1";
    const scope = scopeRaw.toLowerCase().includes("2") ? "Scope 2" : "Scope 1";
    const activity = (activityIdx >= 0 ? cols[activityIdx] : "")?.trim() || "";
    const unit = (unitIdx >= 0 ? cols[unitIdx] : "")?.trim() || "";
    const factorRaw = (factorIdx >= 0 ? cols[factorIdx] : "")?.trim() || "";
    const factorVal = parseFloat(factorRaw.replace(/,/g, ""));
    const emissionFactorUnit = (factorUnitIdx >= 0 ? cols[factorUnitIdx] : "")?.trim() || "tCO2e / unit";
    const ghgGas = (ghgIdx >= 0 ? cols[ghgIdx] : "")?.trim() || "CO2e";
    const region = (regionIdx >= 0 ? cols[regionIdx] : "")?.trim() || "Global";
    const notes = (notesIdx >= 0 ? cols[notesIdx] : "")?.trim() || "";
    const reference = (refIdx >= 0 ? cols[refIdx] : "")?.trim() || "";

    if (!isNaN(year) && !isNaN(factorVal) && activity) {
      rows.push({
        source,
        year,
        scope,
        activity,
        unit,
        emissionFactor: factorVal,
        emissionFactorUnit,
        ghgGas,
        region,
        notes,
        reference,
      });
    }
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function generateCsv(rows: EmissionFactorMasterRow[]): string {
  const header = [
    "Source",
    "Year",
    "Scope",
    "Activity / Fuel Type",
    "Unit",
    "Emission Factor",
    "Emission Factor Unit",
    "GHG / Gas",
    "Geography / Region",
    "Notes",
    "Reference / Evidence",
  ].join(",");

  const escapeCell = (val: string | number) => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = rows.map((r) =>
    [
      escapeCell(r.source),
      r.year,
      escapeCell(r.scope),
      escapeCell(r.activity),
      escapeCell(r.unit),
      r.emissionFactor,
      escapeCell(r.emissionFactorUnit),
      escapeCell(r.ghgGas),
      escapeCell(r.region),
      escapeCell(r.notes),
      escapeCell(r.reference),
    ].join(","),
  );

  return [header, ...lines].join("\n");
}

/**
 * Finds or automatically provisions the Emission Factor Master Dataset Google Sheet in Drive.
 */
export async function getOrCreateMasterSheetId(): Promise<string | null> {
  const configuredId = process.env.EMISSION_FACTORS_SHEET_ID || process.env.GOOGLE_SHEETS_EMISSION_FACTORS_ID;
  if (configuredId) return configuredId;

  const drive = getDriveClient();
  if (!drive) return null;

  const rootFolderId = getRootFolderId();
  try {
    const existing = await findChild(rootFolderId, MASTER_SHEET_NAME);
    if (existing?.id) return existing.id;

    // Create the master spreadsheet
    const csvContent = generateCsv(MASTER_DATASET_SEED);
    const created = await drive.files.create({
      requestBody: {
        name: MASTER_SHEET_NAME,
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [rootFolderId],
      },
      media: {
        mimeType: "text/csv",
        body: Readable.from(Buffer.from(csvContent, "utf8")),
      },
      fields: "id",
      supportsAllDrives: true,
    });

    return created.data.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Dynamically fetches the Emission Factor Master Dataset from Google Sheets.
 */
export async function fetchEmissionFactorsFromGoogleSheet(forceRefresh = false): Promise<EmissionFactorMasterRow[]> {
  const now = Date.now();
  if (!forceRefresh && cachedMasterRows && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedMasterRows;
  }

  const drive = getDriveClient();
  if (drive) {
    try {
      const sheetId = await getOrCreateMasterSheetId();
      if (sheetId) {
        const exportRes = await drive.files.export(
          {
            fileId: sheetId,
            mimeType: "text/csv",
          },
          { responseType: "text" },
        );

        const csvText = String(exportRes.data ?? "");
        const rows = parseCsv(csvText);
        if (rows.length > 0) {
          cachedMasterRows = rows;
          cacheTimestamp = now;
          return rows;
        }
      }
    } catch {
      // If network / API fails, use cached or fallback seed
    }
  }

  cachedMasterRows = MASTER_DATASET_SEED;
  cacheTimestamp = now;
  return MASTER_DATASET_SEED;
}

export function clearEmissionFactorsCache(): void {
  cachedMasterRows = null;
  cacheTimestamp = 0;
}

/**
 * Searches the dynamic Google Sheet emission factor dataset for the best match.
 */
export async function findEmissionFactorFromMaster(params: {
  scope: Scope | "Scope 1" | "Scope 2";
  activity: string;
  year: number;
  source?: string;
  region?: string;
}): Promise<EmissionFactor | null> {
  const masterRows = await fetchEmissionFactorsFromGoogleSheet();
  const normalizedScope = params.scope.toLowerCase().replace(/\s+/g, "");
  const normalizedActivity = params.activity.toLowerCase().trim();
  const requestedSource = params.source?.toUpperCase().trim();
  const requestedRegion = params.region?.toLowerCase().trim();

  // 1. Filter by Scope & Activity
  const matchingScopeAndActivity = masterRows.filter((row) => {
    const rowScope = row.scope.toLowerCase().replace(/\s+/g, "");
    if (rowScope !== normalizedScope) return false;

    const rowAct = row.activity.toLowerCase().trim();
    if (rowAct === normalizedActivity) return true;

    // Synonyms / normalized matching
    if (
      (normalizedActivity === "electricity" || normalizedActivity === "grid electricity") &&
      (rowAct === "electricity" || rowAct === "grid electricity")
    ) {
      return true;
    }
    if (
      (normalizedActivity === "petrol" || normalizedActivity === "gasoline") &&
      (rowAct === "petrol" || rowAct === "gasoline")
    ) {
      return true;
    }

    return false;
  });

  if (!matchingScopeAndActivity.length) {
    return null;
  }

  // 2. Filter by Source if requested, or select best source (e.g. DEFRA for Scope 1, CEA for Scope 2 India)
  let candidateRows = matchingScopeAndActivity;
  if (requestedSource) {
    const bySource = candidateRows.filter((r) => r.source.toUpperCase() === requestedSource);
    if (bySource.length) candidateRows = bySource;
  } else if (requestedRegion) {
    const byRegion = candidateRows.filter(
      (r) => r.region.toLowerCase().includes(requestedRegion) || requestedRegion.includes(r.region.toLowerCase()),
    );
    if (byRegion.length) candidateRows = byRegion;
  } else {
    // Default source preference
    if (normalizedScope === "scope1") {
      const defraRows = candidateRows.filter((r) => r.source.toUpperCase() === "DEFRA");
      if (defraRows.length) candidateRows = defraRows;
    } else if (normalizedScope === "scope2") {
      const ceaRows = candidateRows.filter((r) => r.source.toUpperCase() === "CEA");
      if (ceaRows.length) candidateRows = ceaRows;
    }
  }

  // 3. Match Year (Exact match, or closest available year)
  let chosenRow = candidateRows.find((r) => r.year === params.year);
  if (!chosenRow) {
    // Find closest year
    candidateRows.sort((a, b) => Math.abs(a.year - params.year) - Math.abs(b.year - params.year));
    chosenRow = candidateRows[0];
  }

  if (!chosenRow) return null;

  return {
    value: chosenRow.emissionFactor,
    unit: chosenRow.emissionFactorUnit || chosenRow.unit,
    source: chosenRow.source,
    publisher: chosenRow.source,
    document: chosenRow.reference || chosenRow.notes || `${chosenRow.source} Emission Factors`,
    year: chosenRow.year,
    activity: chosenRow.activity,
    ghgGas: chosenRow.ghgGas,
    region: chosenRow.region,
    notes: chosenRow.notes,
    reference: chosenRow.reference,
  };
}

/**
 * Fetch Scope 1 factor dynamically from Google Sheet master dataset.
 */
export async function getScope1Factor(
  fuel: FuelType | string,
  year: number,
  source?: string,
): Promise<EmissionFactor | null> {
  return findEmissionFactorFromMaster({
    scope: "Scope 1",
    activity: fuel,
    year,
    source,
  });
}

/**
 * Fetch Scope 2 factor dynamically from Google Sheet master dataset.
 */
export async function getScope2Factor(
  year: number,
  source?: string,
  activity = "Electricity",
): Promise<EmissionFactor | null> {
  return findEmissionFactorFromMaster({
    scope: "Scope 2",
    activity,
    year,
    source,
  });
}

/**
 * Synchronous helper using cached / seed rows.
 */
export function getScope1FactorSync(
  fuel: FuelType | string,
  year: number,
  source = "DEFRA",
): EmissionFactor | null {
  const rows = cachedMasterRows ?? MASTER_DATASET_SEED;
  const match = rows.find(
    (r) =>
      r.scope.toLowerCase().replace(/\s+/g, "") === "scope1" &&
      r.activity.toLowerCase() === fuel.toLowerCase() &&
      r.source.toUpperCase() === source.toUpperCase() &&
      r.year === year,
  );
  if (match) {
    return {
      value: match.emissionFactor,
      unit: match.emissionFactorUnit,
      source: match.source,
      publisher: match.source,
      document: match.reference,
      year: match.year,
    };
  }
  // Fallback to any year for this fuel
  const fallback = rows.find(
    (r) =>
      r.scope.toLowerCase().replace(/\s+/g, "") === "scope1" &&
      r.activity.toLowerCase() === fuel.toLowerCase(),
  );
  if (fallback) {
    return {
      value: fallback.emissionFactor,
      unit: fallback.emissionFactorUnit,
      source: fallback.source,
      publisher: fallback.source,
      document: fallback.reference,
      year: fallback.year,
    };
  }
  return null;
}

/**
 * Synchronous helper using cached / seed rows.
 */
export function getScope2FactorSync(
  year: number,
  source = "CEA",
  activity = "Electricity",
): EmissionFactor | null {
  const rows = cachedMasterRows ?? MASTER_DATASET_SEED;
  const match = rows.find(
    (r) =>
      r.scope.toLowerCase().replace(/\s+/g, "") === "scope2" &&
      r.activity.toLowerCase().includes(activity.toLowerCase()) &&
      r.source.toUpperCase() === source.toUpperCase() &&
      r.year === year,
  );
  if (match) {
    return {
      value: match.emissionFactor,
      unit: match.emissionFactorUnit,
      source: match.source,
      publisher: match.source,
      document: match.reference,
      year: match.year,
    };
  }
  const fallback = rows.find(
    (r) =>
      r.scope.toLowerCase().replace(/\s+/g, "") === "scope2" &&
      r.source.toUpperCase() === source.toUpperCase(),
  );
  if (fallback) {
    return {
      value: fallback.emissionFactor,
      unit: fallback.emissionFactorUnit,
      source: fallback.source,
      publisher: fallback.source,
      document: fallback.reference,
      year: fallback.year,
    };
  }
  return null;
}
