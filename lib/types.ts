export type FuelType = "Diesel" | "Petrol" | "CNG" | "LNG";
export type SourceType = "Stationary" | "Mobile";
export type Scope = "Scope1" | "Scope2";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  companyId: string;
  createdAt: string;
  passwordReset?: {
    tokenHash: string;
    expiresAt: string;
  } | null;
};

export type Facility = {
  id: string;
  name: string;
  address: string;
};

export type CompanyProfile = {
  id: string;
  name: string;
  industry: string;
  employeeCount: number;
  facilityCount: number;
  facilities: Facility[];
  setupComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SessionPayload = {
  userId: string;
  email: string;
  companyId: string;
  setupComplete: boolean;
  exp: number;
};

export type EmissionFactor = {
  value: number | null;
  unit: string;
  source: string;
  publisher: string;
  document: string;
  year: number;
  activity?: string;
  ghgGas?: string;
  region?: string;
  notes?: string;
  reference?: string;
};

export type Scope1Record = {
  equipmentName: string;
  sourceType: SourceType;
  fuelType: FuelType;
  quantity: number;
  unit: string;
  emissionFactor: number | null;
  emissionFactorUnit: string;
  emissionFactorSource: string;
  emissions: number | null;
  reportingYear: string;
  facilityId: string;
  facilityName: string;
};

export type Scope2Record = {
  electricitySource: string;
  kWh: number;
  emissionFactor: number | null;
  emissionFactorUnit: string;
  emissionFactorSource: string;
  emissions: number | null;
  reportingYear: string;
  facilityId: string;
  facilityName: string;
};

export type ProcessedDataset<T> = {
  scope: Scope;
  reportingYear: string;
  calendarYear: number;
  facilityId: string;
  facilityName: string;
  records: T[];
  uploadedAt: string;
  originalFileName: string;
};

export type DatasetMetadata = {
  scope: Scope;
  reportingYear: string;
  calendarYear: number;
  facilityId: string;
  originalFileName: string;
  rowCount: number;
  uploadedAt: string;
};
