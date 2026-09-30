import type { EmissionFactor, FuelType } from "./types";

const DEFRA_SOURCE =
  "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting";
const CEA_SOURCE = "https://cea.nic.in/cdm-co2-baseline-database/";
const IPCC_SOURCE = "https://www.ipcc-nggip.iges.or.jp/EFDB/main.php";

const FUELS: FuelType[] = ["Diesel", "Petrol", "CNG", "LNG"];
const DEFRA_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026] as const;

// Official DEFRA / UK Government Scope 1 GHG Conversion Factors 2025 (Fuels worksheet)
// Converted to tCO2e per activity unit (litres for liquid fuels, kg for gaseous fuels):
// - Diesel (average biofuel blend): 2.54016 kgCO2e / litre => 0.00254016 tCO2e / litre
// - Petrol (average biofuel blend): 2.06916 kgCO2e / litre => 0.00206916 tCO2e / litre
// - CNG: 2575.46441 kgCO2e / tonne => 2.57546441 kgCO2e / kg => 0.00257546441 tCO2e / kg
// - LNG: 2603.30441 kgCO2e / tonne => 2.60330441 kgCO2e / kg => 0.00260330441 tCO2e / kg
const SCOPE1_FACTORS_BY_FUEL: Record<FuelType, { value: number; unit: string }> = {
  Diesel: { value: 2.54016 / 1000, unit: "kgCO2e / litre" },
  Petrol: { value: 2.06916 / 1000, unit: "kgCO2e / litre" },
  CNG: { value: 2575.46441 / 1000000, unit: "kgCO2e / kg" },
  LNG: { value: 2603.30441 / 1000000, unit: "kgCO2e / kg" },
};

function defraFactor(fuel: FuelType, year: number): EmissionFactor {
  const fuelData = SCOPE1_FACTORS_BY_FUEL[fuel];

  return {
    value: fuelData ? fuelData.value : null,
    unit: fuelData ? fuelData.unit : "kgCO2e / unit",
    source: DEFRA_SOURCE,
    publisher: "DEFRA/DESNZ",
    document: "UK Government GHG Conversion Factors for Company Reporting",
    year,
  };
}

// Official CEA India Grid Weighted Average Emission Factors (Table S / Annexure-I / Appendix C)
// Converted to tCO2e / kWh (1 tCO2 / MWh = 0.001 tCO2e / kWh):
// - FY25 (2024-25) & FY26: 0.710 tCO2 / MWh => 0.000710 tCO2e / kWh
// - FY24 (2023-24): 0.727 tCO2 / MWh => 0.000727 tCO2e / kWh
// - FY23 (2022-23): 0.716 tCO2 / MWh => 0.000716 tCO2e / kWh
// - FY22 (2021-22): 0.715 tCO2 / MWh => 0.000715 tCO2e / kWh
// - FY21 (2020-21): 0.703 tCO2 / MWh => 0.000703 tCO2e / kWh
// - FY20 (2019-20): 0.713 tCO2 / MWh => 0.000713 tCO2e / kWh
const CEA_GRID_FACTORS_BY_YEAR: Record<number, number> = {
  2020: 0.713 / 1000,
  2021: 0.703 / 1000,
  2022: 0.715 / 1000,
  2023: 0.716 / 1000,
  2024: 0.727 / 1000,
  2025: 0.710 / 1000,
  2026: 0.710 / 1000,
};

function ceaFactor(year: number): EmissionFactor {
  const value = CEA_GRID_FACTORS_BY_YEAR[year] ?? 0.710 / 1000;
  return {
    value,
    unit: "tCO2e / kWh",
    source: CEA_SOURCE,
    publisher: "CEA India",
    document: "CO2 Baseline Database for the Indian Power Sector (v21.0)",
    year,
  };
}

export const FUEL_TYPES: FuelType[] = [...FUELS];

export const defraDesnzFactors: Record<number, Record<FuelType, EmissionFactor>> =
  Object.fromEntries(
    DEFRA_YEARS.map((year) => [
      year,
      Object.fromEntries(FUELS.map((fuel) => [fuel, defraFactor(fuel, year)])),
    ]),
  ) as Record<number, Record<FuelType, EmissionFactor>>;

export const ceaIndiaGridFactors: Record<number, EmissionFactor> = Object.fromEntries(
  DEFRA_YEARS.map((year) => [year, ceaFactor(year)]),
) as Record<number, EmissionFactor>;

export const ipccEfdbReference = {
  source: IPCC_SOURCE,
  publisher: "IPCC",
  document: "IPCC Emission Factor Database (EFDB)",
};

export function getScope1Factor(fuel: FuelType, year: number): EmissionFactor | null {
  return defraDesnzFactors[year]?.[fuel] ?? defraFactor(fuel, year);
}

export function getScope2Factor(year: number): EmissionFactor | null {
  return ceaIndiaGridFactors[year] ?? ceaFactor(year);
}
