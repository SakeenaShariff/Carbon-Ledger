import { randomUUID } from "crypto";
import { createFolder, ensureFolderPath, findChild, getRootFolderId, readJson, writeJson } from "./drive";
import type { CompanyProfile, Facility } from "./types";

export function companyFolderName(companyId: string): string {
  return `Company_${companyId}`;
}

export function facilityFolderName(facilityId: string): string {
  return `Facility_${facilityId}`;
}

export async function companyFolderId(companyId: string): Promise<string> {
  return createFolder(getRootFolderId(), companyFolderName(companyId));
}

export async function readCompany(companyId: string): Promise<CompanyProfile | null> {
  const folderId = await companyFolderId(companyId);
  const file = await findChild(folderId, "company.json");
  if (!file) return null;
  return readJson<CompanyProfile>(file.id);
}

export async function writeCompany(company: CompanyProfile): Promise<void> {
  const folderId = await companyFolderId(company.id);
  await writeJson(folderId, "company.json", company);
  await createFolder(folderId, "users");
}

export async function createCompanyStub(): Promise<CompanyProfile> {
  const company: CompanyProfile = {
    id: randomUUID(),
    name: "",
    industry: "",
    employeeCount: 0,
    facilityCount: 0,
    facilities: [],
    setupComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await writeCompany(company);
  return company;
}

export async function completeCompanySetup(params: {
  companyId: string;
  name: string;
  industry: string;
  employeeCount: number;
  facilities: Array<{ name: string; address: string }>;
}): Promise<CompanyProfile> {
  const existing = await readCompany(params.companyId);
  if (!existing) throw new Error("Company not found");

  const facilities: Facility[] = params.facilities.map((facility) => ({
    id: randomUUID(),
    name: facility.name.trim(),
    address: facility.address.trim(),
  }));

  const company: CompanyProfile = {
    ...existing,
    name: params.name.trim(),
    industry: params.industry.trim(),
    employeeCount: params.employeeCount,
    facilityCount: facilities.length,
    facilities,
    setupComplete: true,
    updatedAt: new Date().toISOString(),
  };

  await writeCompany(company);

  const folderId = await companyFolderId(company.id);
  for (const facility of facilities) {
    const facilityFolder = await createFolder(folderId, facilityFolderName(facility.id));
    await writeJson(facilityFolder, "facility.json", facility);
  }

  return company;
}

export function assertFacilityOwned(company: CompanyProfile, facilityId: string): Facility {
  const facility = company.facilities.find((f) => f.id === facilityId);
  if (!facility) {
    throw new Error("Facility not found for this company.");
  }
  return facility;
}

export async function getScopeFolder(params: {
  companyId: string;
  facilityId: string;
  reportingYear: string;
  scope: "Scope1" | "Scope2";
}): Promise<string> {
  return ensureFolderPath([
    companyFolderName(params.companyId),
    facilityFolderName(params.facilityId),
    params.reportingYear,
    params.scope,
  ]);
}
