"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Alert } from "@/components/ui";
import { formatNumber, formatTco2e } from "@/lib/metrics";

const SCOPE1 = "#8ED1C6";
const SCOPE2 = "#F29E7D";
const PRIMARY = "#1F6F8B";
const GRID = "#d5e4ea";

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid #d5e4ea",
  boxShadow: "0 8px 30px rgba(22, 50, 63, 0.06)",
  background: "#FFFFFF",
  color: "#16323F",
};

type View = "overview" | "scope1" | "scope2";

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 font-heading text-3xl text-ink">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card min-h-[320px]">
      <h3 className="mb-4 font-heading text-xl">{title}</h3>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

function UnavailableChart({ message = "Emission factor unavailable. Activity data is stored; emissions cannot be charted until factors are provided." }: { message?: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl bg-canvas px-6 text-center text-sm text-muted">
      {message}
    </div>
  );
}

function formatMaybe(value: number | null | undefined, asEmissions = true) {
  if (value === null || value === undefined) return "Emission factor unavailable";
  return asEmissions ? formatTco2e(value) : formatNumber(value);
}

function allNull(values: Array<number | null | undefined>) {
  return values.every((v) => v === null || v === undefined);
}

function yoyLabel(block?: {
  message?: string;
  absolute?: number | null;
  percent?: number | null;
  previousYear?: string | null;
}) {
  if (!block) return "—";
  if (block.message) return block.message;
  const abs = formatMaybe(block.absolute ?? null);
  const pct =
    block.percent === null || block.percent === undefined
      ? "Emission factor unavailable"
      : `${block.percent.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  return `${abs}${block.previousYear ? ` vs ${block.previousYear}` : ""} (${pct})`;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string }>>([]);
  const [years, setYears] = useState<string[]>([]);
  const [facilityId, setFacilityId] = useState("all");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [empty, setEmpty] = useState(false);
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [scope1, setScope1] = useState<Record<string, unknown> | null>(null);
  const [scope2, setScope2] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const metaRes = await fetch("/api/dashboard/meta");
    const meta = await metaRes.json();
    if (!metaRes.ok) {
      setError(meta.error ?? "Unable to load dashboard");
      setLoading(false);
      return;
    }
    setFacilities(meta.facilities ?? []);
    if (!meta.hasData) {
      setEmpty(true);
      setYears([]);
      setLoading(false);
      return;
    }
    setEmpty(false);
    const qs = `facilityId=${encodeURIComponent(facilityId)}&year=${encodeURIComponent(year)}`;
    const [o, s1, s2] = await Promise.all([
      fetch(`/api/dashboard/overview?${qs}`).then((r) => r.json()),
      fetch(`/api/dashboard/scope1?${qs}`).then((r) => r.json()),
      fetch(`/api/dashboard/scope2?${qs}`).then((r) => r.json()),
    ]);
    setOverview(o);
    setScope1(s1);
    setScope2(s2);
    const viewYears: string[] =
      view === "scope1" ? (s1.years ?? []) : view === "scope2" ? (s2.years ?? []) : (o.years ?? []);
    setYears(viewYears);
    const selected =
      view === "scope1" ? s1.selectedYear : view === "scope2" ? s2.selectedYear : o.selectedYear;
    const nextYear = selected || "";
    if (nextYear !== year) setYear(nextYear);
    setLoading(false);
  }, [facilityId, year, view]);

  useEffect(() => {
    void load();
  }, [load]);

  const yoy = (data: Record<string, unknown> | null) => {
    const block = data?.yoy as
      | { message?: string; absolute?: number | null; percent?: number | null; previousYear?: string | null }
      | undefined;
    if (!block) return null;
    if (block.message) return <Alert tone="info">{block.message}</Alert>;
    if (block.previousYear) {
      return (
        <Alert tone="info">
          Year-on-year vs {block.previousYear}: {formatMaybe(block.absolute ?? null)} ·{" "}
          {block.percent === null || block.percent === undefined
            ? "Emission factor unavailable"
            : `${block.percent.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`}
        </Alert>
      );
    }
    return null;
  };

  const currentHasData =
    view === "overview"
      ? Boolean(overview?.hasData)
      : view === "scope1"
        ? Boolean(scope1?.hasData)
        : Boolean(scope2?.hasData);

  const overviewSplit = ((overview?.charts as { split?: Array<{ name: string; value: number | null }> })?.split || []).filter(
    (d): d is { name: string; value: number } => typeof d.value === "number" && d.value > 0,
  );

  const scope1StationaryVsMobile = ((scope1?.charts as { stationaryVsMobile?: Array<{ name: string; value: number | null }> })?.stationaryVsMobile || []).filter(
    (d): d is { name: string; value: number } => typeof d.value === "number" && d.value > 0,
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl text-ink">Dashboard</h1>
          <p className="mt-2 text-muted">Figures come from processed Google Drive datasets only.</p>
        </div>
        <div className="flex rounded-2xl bg-white p-1 shadow-card">
          {(["overview", "scope1", "scope2"] as View[]).map((item) => (
            <button
              key={item}
              className={`rounded-2xl px-4 py-2 capitalize transition ${view === item ? "bg-primary text-white" : "text-muted"}`}
              onClick={() => setView(item)}
            >
              {item === "scope1" ? "Scope 1" : item === "scope2" ? "Scope 2" : "Overview"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="card">
          <span className="text-sm text-muted">Facility</span>
          <select className="input mt-2" value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="card">
          <span className="text-sm text-muted">Year</span>
          <select className="input mt-2" value={year} onChange={(e) => setYear(e.target.value)} disabled={!years.length}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="mt-6">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}
      {loading ? <div className="card mt-6 text-muted">Loading dashboard…</div> : null}

      {!loading && (empty || !currentHasData) ? (
        <div className="card mt-8 max-w-xl">
          <h2 className="font-heading text-2xl">No emissions data yet.</h2>
          <p className="mt-2 text-muted">Upload your Scope 1 or Scope 2 data to get started.</p>
          <Link className="btn-primary mt-6 inline-flex" href="/upload">
            Upload
          </Link>
        </div>
      ) : null}

      {!loading && !empty && currentHasData && view === "overview" && overview ? (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Total emissions" value={formatMaybe((overview.kpis as { total: number | null }).total)} />
            <Kpi label="Scope 1 emissions" value={formatMaybe((overview.kpis as { scope1: number | null }).scope1)} />
            <Kpi label="Scope 2 emissions" value={formatMaybe((overview.kpis as { scope2: number | null }).scope2)} />
            <Kpi label="Change vs previous year" value={yoyLabel(overview.yoy as never)} />
          </div>
          {yoy(overview)}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Scope 1 vs Scope 2 share">
              {!mounted || overviewSplit.length === 0 ? (
                <UnavailableChart message={overviewSplit.length === 0 ? "No emissions share data available for this selection." : "Loading chart…"} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overviewSplit}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {overviewSplit.map((entry, index) => (
                        <Cell key={`split-cell-${index}`} fill={entry.name === "Scope 1" ? SCOPE1 : SCOPE2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(val: unknown) => [formatTco2e(Number(val) || 0), "Emissions"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
            <ChartCard title="Total emissions by year">
              {!mounted || allNull(((overview.charts as { byYear: Array<{ total: number | null }> })?.byYear || []).map((d) => d.total)) ? (
                <UnavailableChart />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(overview.charts as { byYear: Array<{ year: string; scope1: number | null; scope2: number | null }> }).byYear}
                  >
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip contentStyle={tooltipStyle} formatter={(val: unknown) => [formatTco2e(Number(val) || 0), ""]} />
                    <Legend />
                    <Bar dataKey="scope1" name="Scope 1" fill={SCOPE1} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="scope2" name="Scope 2" fill={SCOPE2} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
          <ChartCard title="Emissions by facility">
            {!mounted || allNull(((overview.charts as { byFacility: Array<{ total: number | null }> })?.byFacility || []).map((d) => d.total)) ? (
              <UnavailableChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    (overview.charts as { byFacility: Array<{ facility: string; scope1: number | null; scope2: number | null }> })
                      .byFacility
                  }
                >
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="facility" />
                  <YAxis />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: unknown) => [formatTco2e(Number(val) || 0), ""]} />
                  <Legend />
                  <Bar dataKey="scope1" name="Scope 1" fill={SCOPE1} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="scope2" name="Scope 2" fill={SCOPE2} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      ) : null}

      {!loading && !empty && currentHasData && view === "scope1" && scope1 ? (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Total Scope 1 emissions" value={formatMaybe((scope1.kpis as { total: number | null }).total)} />
            <Kpi label="Stationary emissions" value={formatMaybe((scope1.kpis as { stationary: number | null }).stationary)} />
            <Kpi label="Mobile emissions" value={formatMaybe((scope1.kpis as { mobile: number | null }).mobile)} />
            <Kpi label="Top fuel" value={String((scope1.kpis as { topFuel: string }).topFuel)} />
          </div>
          {yoy(scope1)}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Emissions by fuel">
              {!mounted || allNull(((scope1.charts as { byFuel: Array<{ value: number | null }> })?.byFuel || []).map((d) => d.value)) ? (
                <UnavailableChart />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(scope1.charts as { byFuel: Array<{ fuel: string; value: number | null }> }).byFuel}>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="fuel" />
                    <YAxis />
                    <Tooltip contentStyle={tooltipStyle} formatter={(val: unknown) => [formatTco2e(Number(val) || 0), "Emissions"]} />
                    <Bar dataKey="value" fill={SCOPE1} radius={[8, 8, 0, 0]} name="tCO2e" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
            <ChartCard title="Stationary vs Mobile">
              {!mounted || scope1StationaryVsMobile.length === 0 ? (
                <UnavailableChart message={scope1StationaryVsMobile.length === 0 ? "No stationary/mobile emissions data available." : "Loading chart…"} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scope1StationaryVsMobile}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {scope1StationaryVsMobile.map((entry, index) => (
                        <Cell key={`svm-cell-${index}`} fill={entry.name === "Stationary" ? SCOPE1 : PRIMARY} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(val: unknown) => [formatTco2e(Number(val) || 0), "Emissions"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
          <ChartCard title="Top 5 equipment">
            {!mounted || allNull(((scope1.charts as { topEquipment: Array<{ value: number | null }> })?.topEquipment || []).map((d) => d.value)) ? (
              <UnavailableChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(scope1.charts as { topEquipment: Array<{ name: string; value: number | null }> }).topEquipment}
                  layout="vertical"
                >
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: unknown) => [formatTco2e(Number(val) || 0), "Emissions"]} />
                  <Bar dataKey="value" fill={SCOPE1} radius={[0, 8, 8, 0]} name="tCO2e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      ) : null}

      {!loading && !empty && currentHasData && view === "scope2" && scope2 ? (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Kpi
              label="Total electricity consumed (kWh)"
              value={
                (scope2.kpis as { totalKwh: number | null }).totalKwh === null
                  ? "—"
                  : `${Number((scope2.kpis as { totalKwh: number }).totalKwh).toLocaleString()} kWh`
              }
            />
            <Kpi
              label="Total Scope 2 emissions"
              value={formatMaybe((scope2.kpis as { totalEmissions: number | null }).totalEmissions)}
            />
            <Kpi label="Change vs previous year" value={yoyLabel(scope2.yoy as never)} />
          </div>
          {yoy(scope2)}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Emissions by facility">
              {!mounted || allNull(((scope2.charts as { emissionsByFacility: Array<{ emissions: number | null }> })?.emissionsByFacility || []).map((d) => d.emissions)) ? (
                <UnavailableChart />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      (scope2.charts as { emissionsByFacility: Array<{ facility: string; emissions: number | null }> })
                        .emissionsByFacility
                    }
                  >
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="facility" />
                    <YAxis />
                    <Tooltip contentStyle={tooltipStyle} formatter={(val: unknown) => [formatTco2e(Number(val) || 0), "Emissions"]} />
                    <Bar dataKey="emissions" fill={SCOPE2} radius={[8, 8, 0, 0]} name="tCO2e" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
            <ChartCard title="kWh by facility">
              {!mounted ? (
                <UnavailableChart message="Loading chart…" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(scope2.charts as { kwhByFacility: Array<{ facility: string; kWh: number }> }).kwhByFacility}
                  >
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="facility" />
                    <YAxis />
                    <Tooltip contentStyle={tooltipStyle} formatter={(val: unknown) => [`${Number(val).toLocaleString()} kWh`, "Electricity"]} />
                    <Bar dataKey="kWh" fill={SCOPE2} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
          <ChartCard title="Emissions by year">
            {!mounted || allNull(((scope2.charts as { emissionsByYear: Array<{ emissions: number | null }> })?.emissionsByYear || []).map((d) => d.emissions)) ? (
              <UnavailableChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    (scope2.charts as { emissionsByYear: Array<{ year: string; emissions: number | null }> })
                      .emissionsByYear
                  }
                >
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: unknown) => [formatTco2e(Number(val) || 0), "Emissions"]} />
                  <Bar dataKey="emissions" fill={SCOPE2} radius={[8, 8, 0, 0]} name="tCO2e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      ) : null}
    </AppShell>
  );
}
