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

export async function updateCompany(params: {
  companyId: string;
  name?: string;
  industry?: string;
  employeeCount?: number;
}): Promise<CompanyProfile> {
  const existing = await readCompany(params.companyId);
  if (!existing) throw new Error("Company not found");

  const company: CompanyProfile = {
    ...existing,
    name: params.name !== undefined ? params.name.trim() : existing.name,
    industry: params.industry !== undefined ? params.industry.trim() : existing.industry,
    employeeCount: params.employeeCount !== undefined ? params.employeeCount : existing.employeeCount,
    updatedAt: new Date().toISOString(),
  };

  await writeCompany(company);
  return company;
}

export async function addCompanyFacility(params: {
  companyId: string;
  name: string;
  address: string;
}): Promise<{ company: CompanyProfile; facility: Facility }> {
  const existing = await readCompany(params.companyId);
  if (!existing) throw new Error("Company not found");

  const facility: Facility = {
    id: randomUUID(),
    name: params.name.trim(),
    address: params.address.trim(),
  };

  const facilities = [...existing.facilities, facility];
  const company: CompanyProfile = {
    ...existing,
    facilities,
    facilityCount: facilities.length,
    updatedAt: new Date().toISOString(),
  };

  await writeCompany(company);

  const folderId = await companyFolderId(company.id);
  const facilityFolder = await createFolder(folderId, facilityFolderName(facility.id));
  await writeJson(facilityFolder, "facility.json", facility);

  return { company, facility };
}

export async function updateCompanyFacility(params: {
  companyId: string;
  facilityId: string;
  name: string;
  address: string;
}): Promise<CompanyProfile> {
  const existing = await readCompany(params.companyId);
  if (!existing) throw new Error("Company not found");

  const index = existing.facilities.findIndex((f) => f.id === params.facilityId);
  if (index === -1) throw new Error("Facility not found");

  const updatedFacility: Facility = {
    ...existing.facilities[index],
    name: params.name.trim(),
    address: params.address.trim(),
  };

  const facilities = [...existing.facilities];
  facilities[index] = updatedFacility;

  const company: CompanyProfile = {
    ...existing,
    facilities,
    facilityCount: facilities.length,
    updatedAt: new Date().toISOString(),
  };

  await writeCompany(company);

  const folderId = await companyFolderId(company.id);
  const facilityFolder = await createFolder(folderId, facilityFolderName(updatedFacility.id));
  await writeJson(facilityFolder, "facility.json", updatedFacility);

  return company;
}

export async function removeCompanyFacility(params: {
  companyId: string;
  facilityId: string;
}): Promise<CompanyProfile> {
  const existing = await readCompany(params.companyId);
  if (!existing) throw new Error("Company not found");

  const facilities = existing.facilities.filter((f) => f.id !== params.facilityId);
  if (facilities.length === existing.facilities.length) {
    throw new Error("Facility not found");
  }

  const company: CompanyProfile = {
    ...existing,
    facilities,
    facilityCount: facilities.length,
    updatedAt: new Date().toISOString(),
  };

  await writeCompany(company);
  return company;
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
