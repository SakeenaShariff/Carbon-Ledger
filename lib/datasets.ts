import { findChild, getRootFolderId, listChildren, readJson, replaceFolderContents } from "./drive";
import {
  assertFacilityOwned,
  companyFolderId,
  companyFolderName,
  facilityFolderName,
  getScopeFolder,
} from "./company";
import type {
  CompanyProfile,
  DatasetMetadata,
  ProcessedDataset,
  Scope,
  Scope1Record,
  Scope2Record,
} from "./types";

function scopeFolderNames(scope: Scope): string[] {
  return scope === "Scope1" ? ["Scope1", "Scope 1"] : ["Scope2", "Scope 2"];
}

export async function findScopeFolderId(params: {
  companyId: string;
  facilityId: string;
  reportingYear: string;
  scope: Scope;
}): Promise<string | null> {
  const company = await findChild(getRootFolderId(), companyFolderName(params.companyId));
  if (!company) return null;
  const facility = await findChild(company.id, facilityFolderName(params.facilityId));
  if (!facility) return null;
  const year = await findChild(facility.id, params.reportingYear);
  if (!year) return null;
  for (const name of scopeFolderNames(params.scope)) {
    const folder = await findChild(year.id, name);
    if (folder) return folder.id;
  }
  return null;
}

export async function datasetExists(params: {
  companyId: string;
  facilityId: string;
  reportingYear: string;
  scope: Scope;
}): Promise<boolean> {
  const folderId = await findScopeFolderId(params);
  if (!folderId) return false;
  const processed = await findChild(folderId, "processed.json");
  return Boolean(processed);
}

export async function saveDataset<T>(params: {
  companyId: string;
  facilityId: string;
  facilityName: string;
  reportingYear: string;
  calendarYear: number;
  scope: Scope;
  records: T[];
  originalFileName: string;
  originalBuffer: Buffer;
}): Promise<void> {
  const folderId = await getScopeFolder(params);
  const uploadedAt = new Date().toISOString();
  const processed: ProcessedDataset<T> = {
    scope: params.scope,
    reportingYear: params.reportingYear,
    calendarYear: params.calendarYear,
    facilityId: params.facilityId,
    facilityName: params.facilityName,
    records: params.records,
    uploadedAt,
    originalFileName: params.originalFileName,
  };
  const metadata: DatasetMetadata = {
    scope: params.scope,
    reportingYear: params.reportingYear,
    calendarYear: params.calendarYear,
    facilityId: params.facilityId,
    originalFileName: params.originalFileName,
    rowCount: params.records.length,
    uploadedAt,
  };

  await replaceFolderContents(folderId, [
    {
      name: params.originalFileName || "original.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: params.originalBuffer,
    },
    {
      name: "original.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: params.originalBuffer,
    },
    {
      name: "processed.json",
      mimeType: "application/json",
      body: JSON.stringify(processed, null, 2),
    },
    {
      name: "metadata.json",
      mimeType: "application/json",
      body: JSON.stringify(metadata, null, 2),
    },
  ]);
}

export async function loadProcessed<T>(params: {
  companyId: string;
  facilityId: string;
  reportingYear: string;
  scope: Scope;
}): Promise<ProcessedDataset<T> | null> {
  const folderId = await findScopeFolderId(params);
  if (!folderId) return null;
  const file = await findChild(folderId, "processed.json");
  if (!file) return null;
  return readJson<ProcessedDataset<T>>(file.id);
}

export type LoadedScope1 = ProcessedDataset<Scope1Record>;
export type LoadedScope2 = ProcessedDataset<Scope2Record>;

import { getScope1Factor, getScope2Factor } from "./emissionFactors";
import { reportingYearToCalendarYear } from "./years";

export async function listCompanyDatasets(company: CompanyProfile): Promise<{
  facilities: Array<{ id: string; name: string }>;
  years: string[];
  scope1: LoadedScope1[];
  scope2: LoadedScope2[];
}> {
  const companyId = company.id;
  const root = await companyFolderId(companyId);
  const children = await listChildren(root);
  const facilityFolders = children.filter((c) => c.name.startsWith("Facility_"));

  const scope1: LoadedScope1[] = [];
  const scope2: LoadedScope2[] = [];
  const years = new Set<string>();

  for (const folder of facilityFolders) {
    const facilityId = folder.name.replace(/^Facility_/, "");
    const owned = company.facilities.find((f) => f.id === facilityId);
    if (!owned) continue;

    const yearFolders = await listChildren(folder.id);
    for (const yearFolder of yearFolders.filter((y) => y.name.startsWith("FY"))) {
      const scopes = await listChildren(yearFolder.id);
      for (const scopeFolder of scopes) {
        const isScope1 = scopeFolder.name === "Scope1" || scopeFolder.name === "Scope 1";
        const isScope2 = scopeFolder.name === "Scope2" || scopeFolder.name === "Scope 2";
        if (!isScope1 && !isScope2) continue;
        const processed = await findChild(scopeFolder.id, "processed.json");
        if (!processed) continue;
        years.add(yearFolder.name);
        if (isScope1) {
          const loaded = await readJson<LoadedScope1>(processed.id);
          const enrichedRecords = await Promise.all(
            (loaded.records || []).map(async (r) => {
              if (r.emissions !== null && r.emissions !== undefined) return r;
              const calYear = reportingYearToCalendarYear(r.reportingYear) || 2025;
              const factor = await getScope1Factor(r.fuelType, calYear);
              const factorValue = factor?.value ?? null;
              return {
                ...r,
                emissionFactor: r.emissionFactor ?? factorValue,
                emissionFactorUnit: r.emissionFactorUnit || factor?.unit || "",
                emissionFactorSource: factor
                  ? `${factor.publisher} ${factor.year} — ${factor.document}`
                  : r.emissionFactorSource,
                emissions: factorValue !== null && r.quantity != null ? r.quantity * factorValue : null,
              };
            }),
          );
          scope1.push({ ...loaded, records: enrichedRecords });
        } else {
          const loaded = await readJson<LoadedScope2>(processed.id);
          const enrichedRecords = await Promise.all(
            (loaded.records || []).map(async (r) => {
              if (r.emissions !== null && r.emissions !== undefined) return r;
              const calYear = reportingYearToCalendarYear(r.reportingYear) || 2025;
              const factor = await getScope2Factor(calYear);
              const factorValue = factor?.value ?? null;
              return {
                ...r,
                emissionFactor: r.emissionFactor ?? factorValue,
                emissionFactorUnit: r.emissionFactorUnit || factor?.unit || "",
                emissionFactorSource: factor
                  ? `${factor.publisher} ${factor.year} — ${factor.document}`
                  : r.emissionFactorSource,
                emissions: factorValue !== null && r.kWh != null ? r.kWh * factorValue : null,
              };
            }),
          );
          scope2.push({ ...loaded, records: enrichedRecords });
        }
      }
    }
  }

  return {
    facilities: company.facilities.map((f) => ({ id: f.id, name: f.name })),
    years: Array.from(years).sort(),
    scope1,
    scope2,
  };
}

export { assertFacilityOwned, facilityFolderName };
