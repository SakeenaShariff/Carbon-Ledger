"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Alert, Field } from "@/components/ui";

type FacilityDraft = { name: string; address: string };

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState("1");
  const [facilityCount, setFacilityCount] = useState("1");
  const [facilities, setFacilities] = useState<FacilityDraft[]>([{ name: "", address: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const count = useMemo(() => {
    const n = Number(facilityCount);
    return Number.isFinite(n) && n > 0 ? Math.min(50, Math.floor(n)) : 0;
  }, [facilityCount]);

  function updateCount(value: string) {
    setFacilityCount(value);
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) {
      setFacilities([]);
      return;
    }
    const size = Math.min(50, Math.floor(n));
    setFacilities((prev) => {
      const next = [...prev];
      while (next.length < size) next.push({ name: "", address: "" });
      return next.slice(0, size);
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        industry,
        employeeCount: Number(employeeCount),
        facilities,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to save company setup");
      return;
    }
    router.push("/upload");
    router.refresh();
  }

  return (
    <AppShell>
      <h1 className="font-heading text-4xl text-ink">Company setup</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Complete this once. You will not be able to upload or view the dashboard until your company and facilities are saved.
      </p>
      <form className="mt-8 max-w-3xl space-y-6" onSubmit={onSubmit}>
        <div className="card grid gap-4 md:grid-cols-2">
          <Field label="Company name">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Industry">
            <input className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} required />
          </Field>
          <Field label="Employee count">
            <input className="input" type="number" min={1} value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} required />
          </Field>
          <Field label="Number of facilities">
            <input className="input" type="number" min={1} max={50} value={facilityCount} onChange={(e) => updateCount(e.target.value)} required />
          </Field>
        </div>
        <div className="space-y-4">
          {count === 0 ? <Alert tone="info">Enter a facility count to generate facility rows.</Alert> : null}
          {facilities.map((facility, index) => (
            <div key={index} className="card grid gap-4 md:grid-cols-2">
              <h2 className="font-heading text-xl md:col-span-2">Facility {index + 1}</h2>
              <Field label="Facility name">
                <input
                  className="input"
                  value={facility.name}
                  onChange={(e) =>
                    setFacilities((prev) => prev.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)))
                  }
                  required
                />
              </Field>
              <Field label="Address">
                <input
                  className="input"
                  value={facility.address}
                  onChange={(e) =>
                    setFacilities((prev) => prev.map((item, i) => (i === index ? { ...item, address: e.target.value } : item)))
                  }
                  required
                />
              </Field>
            </div>
          ))}
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <button className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Save and continue"}
        </button>
      </form>
    </AppShell>
  );
}
