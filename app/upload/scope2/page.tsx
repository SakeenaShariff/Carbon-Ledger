"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Alert, Field } from "@/components/ui";
import { REPORTING_YEARS } from "@/lib/years";

type Facility = { id: string; name: string };

export default function Scope2UploadPage() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityId, setFacilityId] = useState("");
  const [reportingYear, setReportingYear] = useState("FY25");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [replacePrompt, setReplacePrompt] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        const list = data.company?.facilities ?? [];
        setFacilities(list);
        if (list[0]) setFacilityId(list[0].id);
      });
  }, []);

  async function submit(replace: boolean) {
    if (!file) return;
    setLoading(true);
    setErrors([]);
    setMessage("");
    const form = new FormData();
    form.set("scope", "Scope2");
    form.set("facilityId", facilityId);
    form.set("reportingYear", reportingYear);
    form.set("replace", replace ? "true" : "false");
    form.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);
    if (res.status === 409) {
      setReplacePrompt(true);
      return;
    }
    if (!res.ok) {
      setReplacePrompt(false);
      setErrors(data.errors ?? [data.error ?? "Upload failed"]);
      return;
    }
    setReplacePrompt(false);
    setMessage(`Successfully uploaded and saved ${data.rows} rows${data.replaced ? " (replaced existing dataset)" : ""}.`);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await submit(false);
  }

  return (
    <AppShell>
      <h1 className="font-heading text-4xl text-ink">Scope 2 Data Upload</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Upload ONE combined Excel file containing all relevant Scope 2 data (including purchased electricity and renewable energy).
      </p>

      <form className="card mt-8 max-w-2xl space-y-4 border-t-4" style={{ borderColor: "#F29E7D" }} onSubmit={onSubmit}>
        <h2 className="font-heading text-2xl">Upload Details</h2>
        <Field label="Facility">
          <select className="input" value={facilityId} onChange={(e) => setFacilityId(e.target.value)} required suppressHydrationWarning>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reporting year">
          <select className="input" value={reportingYear} onChange={(e) => setReportingYear(e.target.value)} suppressHydrationWarning>
            {REPORTING_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Scope 2 Excel file">
          <input
            ref={fileInputRef}
            className="input"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setErrors([]);
              setMessage("");
            }}
            required
            suppressHydrationWarning
          />
        </Field>
        {replacePrompt ? (
          <div className="space-y-3">
            <Alert tone="info">
              Data already exists for this facility/year.
            </Alert>
            <div className="flex gap-3">
              <button type="button" className="btn-primary" disabled={loading} onClick={() => submit(true)}>
                Replace
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={loading}
                onClick={() => {
                  setReplacePrompt(false);
                  setMessage("");
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        {errors.length ? (
          <Alert tone="error">
            <p className="font-medium">Please fix the following:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </Alert>
        ) : null}
        {message ? (
          <Alert tone="success">
            <div className="flex items-center justify-between gap-3">
              <span>{message}</span>
              <Link href="/dashboard" className="font-semibold underline hover:opacity-80">
                View Dashboard &rarr;
              </Link>
            </div>
          </Alert>
        ) : null}
        {!replacePrompt ? (
          <button className="btn-primary" disabled={loading || !file}>
            {loading ? "Validating & Uploading…" : "Upload and process Scope 2 Data"}
          </button>
        ) : null}
      </form>
    </AppShell>
  );
}
