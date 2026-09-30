import * as XLSX from "xlsx";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "sample-data");
mkdirSync(outDir, { recursive: true });

function writeSheet(filename, headers, rows) {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Data");
  const target = join(outDir, filename);
  XLSX.writeFile(workbook, target);
  console.log("wrote", target);
}

const scope1Headers = ["Equipment name", "Source type", "Fuel type", "Quantity consumed", "Unit"];
const scope2Headers = ["Electricity source or meter name", "Electricity consumed (kWh)"];

const equipment = [
  "Boiler A",
  "Boiler B",
  "Generator 1",
  "Generator 2",
  "Forklift 3",
  "Delivery van 12",
  "Company car 4",
  "Backup genset",
  "Kiln burner",
  "Hot water heater",
  "Site loader",
  "Shuttle bus",
  "Warehouse heater",
  "Process furnace",
  "Compressor diesel",
  "Pickup truck",
  "Lawn equipment",
  "Mobile compressor",
  "Emergency pump",
  "Fleet truck 9",
];

const sources = ["Stationary", "Mobile", "Stationary", "Mobile", "Mobile", "Mobile", "Mobile", "Stationary", "Stationary", "Stationary", "Mobile", "Mobile", "Stationary", "Stationary", "Stationary", "Mobile", "Mobile", "Mobile", "Stationary", "Mobile"];
const fuels = ["Diesel", "Diesel", "Diesel", "Petrol", "CNG", "Petrol", "Petrol", "Diesel", "LNG", "CNG", "Diesel", "CNG", "LNG", "Diesel", "Diesel", "Petrol", "Petrol", "Diesel", "Diesel", "LNG"];
const units = ["litres", "litres", "litres", "litres", "kg", "litres", "litres", "litres", "kg", "kg", "litres", "kg", "kg", "litres", "litres", "litres", "litres", "litres", "litres", "kg"];

function scope1Rows(qtyOffset) {
  return equipment.map((name, i) => [name, sources[i], fuels[i], 120 + i * 15 + qtyOffset, units[i]]);
}

function scope2Rows(kwhOffset) {
  return Array.from({ length: 20 }, (_, i) => [`Meter ${i + 1} - Building ${String.fromCharCode(65 + (i % 5))}`, 8500 + i * 420 + kwhOffset]);
}

writeSheet("Scope1_FY25.xlsx", scope1Headers, scope1Rows(0));
writeSheet("Scope1_FY26.xlsx", scope1Headers, scope1Rows(40));
writeSheet("Scope2_FY25.xlsx", scope2Headers, scope2Rows(0));
writeSheet("Scope2_FY26.xlsx", scope2Headers, scope2Rows(900));

const wrongFuels = [
  ["Boiler A", "Stationary", "Coal", 100, "litres"],
  ["Boiler B", "Stationary", "", 80, "litres"],
  ["Generator 1", "Stationary", "Diesal", 90, "litres"],
  ["Generator 2", "Stationary", " diesel", 110, "litres"],
  ["Forklift 3", "Mobile", "DIESEL", 70, "litres"],
  ["Delivery van 12", "Mobile", " Petrol", 65, "litres"],
  ["Company car 4", "Mobile", "PETROL", 55, "litres"],
  ["Backup genset", "Stationary", "cng", 40, "kg"],
  ["Kiln burner", "Stationary", "LNG", 200, "kg"],
  ["Hot water heater", "Stationary", "CNG", 95, "kg"],
  ["Site loader", "Mobile", "Diesel", 150, "litres"],
  ["Shuttle bus", "Mobile", "Petrol", 88, "litres"],
  ["Warehouse heater", "Stationary", "lng", 77, "kg"],
  ["Process furnace", "Stationary", "Wood", 300, "kg"],
  ["Compressor diesel", "Stationary", "  diesel  ", 120, "litres"],
  ["Pickup truck", "Mobile", "Petroll", 60, "litres"],
  ["Lawn equipment", "Mobile", "petrol", 22, "litres"],
  ["Mobile compressor", "Mobile", "Diesel", 130, "litres"],
  ["Emergency pump", "Stationary", " ", 50, "litres"],
  ["Fleet truck 9", "Mobile", "Gasoline", 140, "litres"],
];

writeSheet("Scope1_wrong_fuel.xlsx", scope1Headers, wrongFuels);
