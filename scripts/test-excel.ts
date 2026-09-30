import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parseScope1Excel, parseScope2Excel } from "../lib/excel";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sample = (name: string) => readFileSync(join(__dirname, "..", "sample-data", name));

const ctx = { reportingYear: "FY25", facilityId: "f1", facilityName: "Plant" };

function mustOk(label: string, result: { ok: boolean; records?: unknown[]; errors?: string[] }) {
  if (!result.ok || !result.records) {
    console.error(label, "FAILED", result.errors);
    process.exitCode = 1;
    return;
  }
  console.log(label, "ok", result.records.length, "rows");
}

function mustFail(label: string, result: { ok: boolean; records?: unknown[]; errors?: string[] }, minErrors = 1) {
  if (result.ok || !result.errors) {
    console.error(label, "should have failed");
    process.exitCode = 1;
    return;
  }
  if (result.errors.length < minErrors) {
    console.error(label, "expected multiple errors, got", result.errors);
    process.exitCode = 1;
    return;
  }
  console.log(label, "rejected with", result.errors.length, "errors");
}

mustOk("Scope1_FY25", parseScope1Excel(sample("Scope1_FY25.xlsx"), ctx));
mustOk("Scope1_FY26", parseScope1Excel(sample("Scope1_FY26.xlsx"), { ...ctx, reportingYear: "FY26" }));
mustOk("Scope2_FY25", parseScope2Excel(sample("Scope2_FY25.xlsx"), ctx));
mustOk("Scope2_FY26", parseScope2Excel(sample("Scope2_FY26.xlsx"), { ...ctx, reportingYear: "FY26" }));
mustFail("Scope1_wrong_fuel", parseScope1Excel(sample("Scope1_wrong_fuel.xlsx"), ctx), 4);

const validS1 = parseScope1Excel(sample("Scope1_FY25.xlsx"), ctx);
if (!validS1.ok || !validS1.records.every((r) => typeof r.emissions === "number" && r.emissions > 0)) {
  console.error("Scope 1 emissions calculation failed or returned non-positive numbers");
  process.exitCode = 1;
} else {
  console.log("Scope 1 emissions verified:", validS1.records.length, "rows calculated successfully");
}

const validS2 = parseScope2Excel(sample("Scope2_FY25.xlsx"), ctx);
if (!validS2.ok || !validS2.records.every((r) => typeof r.emissions === "number" && r.emissions > 0)) {
  console.error("Scope 2 emissions calculation failed or returned non-positive numbers");
  process.exitCode = 1;
} else {
  console.log("Scope 2 emissions verified:", validS2.records.length, "rows calculated successfully");
}

if (process.exitCode) {
  console.error("excel tests failed");
} else {
  console.log("excel tests passed");
}
