"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Alert, Field } from "@/components/ui";

type Facility = {
  id: string;
  name: string;
  address: string;
};

type UserInfo = {
  id: string;
  email: string;
  createdAt: string;
};

type CompanyInfo = {
  id: string;
  name: string;
  industry: string;
  employeeCount: number;
  facilityCount: number;
  facilities: Facility[];
};

export default function ProfilePage() {
  const router = useRouter();

  // Loading & session state
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  // Company Edit Form state
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState("1");
  const [companySaving, setCompanySaving] = useState(false);
  const [companySuccess, setCompanySuccess] = useState("");
  const [companyError, setCompanyError] = useState("");

  // Facility Management state
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [newFacilityName, setNewFacilityName] = useState("");
  const [newFacilityAddress, setNewFacilityAddress] = useState("");
  const [addingFacility, setAddingFacility] = useState(false);
  const [facilityError, setFacilityError] = useState("");
  const [facilitySuccess, setFacilitySuccess] = useState("");

  // Edit Facility state
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [editFacilityName, setEditFacilityName] = useState("");
  const [editFacilityAddress, setEditFacilityAddress] = useState("");
  const [savingEditFacility, setSavingEditFacility] = useState(false);

  // Delete Facility Confirmation state
  const [deletingFacility, setDeletingFacility] = useState<Facility | null>(null);
  const [confirmDeleting, setConfirmDeleting] = useState(false);

  // Logout state
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Unable to load profile data");
      }
      const data = await res.json();
      setUser(data.user);
      setCompany(data.company);
      if (data.company) {
        setCompanyName(data.company.name ?? "");
        setIndustry(data.company.industry ?? "");
        setEmployeeCount(String(data.company.employeeCount ?? 1));
        setFacilities(data.company.facilities ?? []);
      }
    } catch {
      setCompanyError("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveCompany(e: FormEvent) {
    e.preventDefault();
    setCompanyError("");
    setCompanySuccess("");
    setCompanySaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          industry,
          employeeCount: Number(employeeCount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCompanyError(data.error ?? "Failed to update company information");
        return;
      }
      setCompanySuccess("Company information updated successfully.");
      setCompany(data.company);
    } catch {
      setCompanyError("Network error while saving company information.");
    } finally {
      setCompanySaving(false);
    }
  }

  async function onAddFacility(e: FormEvent) {
    e.preventDefault();
    setFacilityError("");
    setFacilitySuccess("");
    setAddingFacility(true);
    try {
      const res = await fetch("/api/profile/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFacilityName,
          address: newFacilityAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFacilityError(data.error ?? "Failed to add facility");
        return;
      }
      setFacilitySuccess(`Facility "${newFacilityName}" added successfully.`);
      setNewFacilityName("");
      setNewFacilityAddress("");
      setFacilities(data.company?.facilities ?? [...facilities, data.facility]);
      if (company) {
        setCompany(data.company);
      }
    } catch {
      setFacilityError("Network error while adding facility.");
    } finally {
      setAddingFacility(false);
    }
  }

  function startEditFacility(facility: Facility) {
    setEditingFacilityId(facility.id);
    setEditFacilityName(facility.name);
    setEditFacilityAddress(facility.address);
    setFacilityError("");
    setFacilitySuccess("");
  }

  function cancelEditFacility() {
    setEditingFacilityId(null);
    setEditFacilityName("");
    setEditFacilityAddress("");
  }

  async function onSaveEditFacility(e: FormEvent) {
    e.preventDefault();
    if (!editingFacilityId) return;
    setSavingEditFacility(true);
    setFacilityError("");
    setFacilitySuccess("");
    try {
      const res = await fetch("/api/profile/facilities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingFacilityId,
          name: editFacilityName,
          address: editFacilityAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFacilityError(data.error ?? "Failed to update facility");
        return;
      }
      setFacilitySuccess(`Facility "${editFacilityName}" updated successfully.`);
      setFacilities(data.company.facilities);
      setCompany(data.company);
      cancelEditFacility();
    } catch {
      setFacilityError("Network error while saving facility.");
    } finally {
      setSavingEditFacility(false);
    }
  }

  function promptDeleteFacility(facility: Facility) {
    setDeletingFacility(facility);
    setFacilityError("");
    setFacilitySuccess("");
  }

  function cancelDeleteFacility() {
    setDeletingFacility(null);
  }

  async function onConfirmDeleteFacility() {
    if (!deletingFacility) return;
    setConfirmDeleting(true);
    setFacilityError("");
    setFacilitySuccess("");
    try {
      const res = await fetch("/api/profile/facilities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingFacility.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFacilityError(data.error ?? "Failed to delete facility");
        return;
      }
      setFacilitySuccess(`Facility "${deletingFacility.name}" has been removed.`);
      setFacilities(data.company.facilities);
      setCompany(data.company);
      setDeletingFacility(null);
    } catch {
      setFacilityError("Network error while removing facility.");
    } finally {
      setConfirmDeleting(false);
    }
  }

  async function onLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted">Loading profile details…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-4xl text-ink">Profile &amp; Account</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Manage your account credentials, company profile, and facility records.
          </p>
        </div>

        {/* 1. Account Information */}
        <section className="card space-y-4">
          <h2 className="font-heading text-2xl text-ink">Account information</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-muted">Email address</span>
              <p className="mt-1 font-medium text-ink">{user?.email ?? "—"}</p>
            </div>
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-muted">User ID</span>
              <p className="mt-1 truncate font-mono text-sm text-ink">{user?.id ?? "—"}</p>
            </div>
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-muted">Member since</span>
              <p className="mt-1 text-ink">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* 2. Company Information */}
        <section className="card space-y-6">
          <h2 className="font-heading text-2xl text-ink">Company profile</h2>
          <form className="space-y-4" onSubmit={onSaveCompany}>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Company name">
                <input
                  className="input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  suppressHydrationWarning
                />
              </Field>
              <Field label="Industry">
                <input
                  className="input"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  required
                  suppressHydrationWarning
                />
              </Field>
              <Field label="Employee count">
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  required
                  suppressHydrationWarning
                />
              </Field>
            </div>

            {companyError ? <Alert tone="error">{companyError}</Alert> : null}
            {companySuccess ? <Alert tone="success">{companySuccess}</Alert> : null}

            <div>
              <button className="btn-primary" disabled={companySaving}>
                {companySaving ? "Saving changes…" : "Save company changes"}
              </button>
            </div>
          </form>
        </section>

        {/* 3. Facility Management */}
        <section className="card space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl text-ink">Facility management</h2>
              <p className="mt-1 text-sm text-muted">
                Add, edit, or remove reporting facilities associated with your company.
              </p>
            </div>
            <div className="rounded-2xl bg-canvas px-4 py-2 text-sm font-medium text-ink">
              {facilities.length} {facilities.length === 1 ? "Facility" : "Facilities"}
            </div>
          </div>

          {facilityError ? <Alert tone="error">{facilityError}</Alert> : null}
          {facilitySuccess ? <Alert tone="success">{facilitySuccess}</Alert> : null}

          {/* Delete Confirmation Modal / Banner */}
          {deletingFacility ? (
            <div className="rounded-2xl border-2 border-[#fde8e4] bg-[#fff5f3] p-4 text-[#8a3a28]">
              <h3 className="font-heading text-lg font-semibold">Confirm facility removal</h3>
              <p className="mt-1 text-sm">
                Are you sure you want to remove <strong>{deletingFacility.name}</strong> ({deletingFacility.address})?
                This facility will no longer be available for reporting.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="btn bg-[#8a3a28] text-white hover:brightness-110"
                  onClick={onConfirmDeleteFacility}
                  disabled={confirmDeleting}
                >
                  {confirmDeleting ? "Removing…" : "Yes, remove facility"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cancelDeleteFacility}
                  disabled={confirmDeleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {/* Existing Facilities List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Existing facilities</h3>
            {facilities.length === 0 ? (
              <p className="py-4 text-sm text-muted">No facilities registered. Add your first facility below.</p>
            ) : (
              <div className="grid gap-3">
                {facilities.map((fac) => (
                  <div
                    key={fac.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-[#d5e4ea] bg-[#fafcfd] p-4 transition md:flex-row md:items-center"
                  >
                    {editingFacilityId === fac.id ? (
                      <form onSubmit={onSaveEditFacility} className="flex-1 space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <Field label="Facility name">
                            <input
                              className="input"
                              value={editFacilityName}
                              onChange={(e) => setEditFacilityName(e.target.value)}
                              required
                              suppressHydrationWarning
                            />
                          </Field>
                          <Field label="Address">
                            <input
                              className="input"
                              value={editFacilityAddress}
                              onChange={(e) => setEditFacilityAddress(e.target.value)}
                              required
                              suppressHydrationWarning
                            />
                          </Field>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-primary py-2 text-sm" disabled={savingEditFacility}>
                            {savingEditFacility ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary py-2 text-sm"
                            onClick={cancelEditFacility}
                            disabled={savingEditFacility}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div>
                          <p className="font-heading text-lg text-ink">{fac.name}</p>
                          <p className="text-sm text-muted">{fac.address}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            className="btn-secondary px-3 py-1.5 text-sm"
                            onClick={() => startEditFacility(fac)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn border border-[#fde8e4] bg-white px-3 py-1.5 text-sm text-[#8a3a28] hover:bg-[#fff5f3]"
                            onClick={() => promptDeleteFacility(fac)}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Facility Form */}
          <div className="rounded-2xl border border-[#d5e4ea] bg-white p-5">
            <h3 className="font-heading text-lg text-ink">Add a new facility</h3>
            <form className="mt-4 space-y-4" onSubmit={onAddFacility}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Facility name">
                  <input
                    className="input"
                    placeholder="e.g. Riverside Manufacturing Plant"
                    value={newFacilityName}
                    onChange={(e) => setNewFacilityName(e.target.value)}
                    required
                    suppressHydrationWarning
                  />
                </Field>
                <Field label="Address">
                  <input
                    className="input"
                    placeholder="e.g. 4500 Industrial Way, Austin, TX"
                    value={newFacilityAddress}
                    onChange={(e) => setNewFacilityAddress(e.target.value)}
                    required
                    suppressHydrationWarning
                  />
                </Field>
              </div>
              <button className="btn-primary" disabled={addingFacility}>
                {addingFacility ? "Adding facility…" : "+ Add facility"}
              </button>
            </form>
          </div>
        </section>

        {/* 4. Session & Logout */}
        <section className="card flex flex-col justify-between gap-4 border border-[#e5eef2] bg-white sm:flex-row sm:items-center">
          <div>
            <h2 className="font-heading text-xl text-ink">Sign out of Carbon Ledger</h2>
            <p className="mt-1 text-sm text-muted">
              End your active session securely. You will be redirected to the Login page.
            </p>
          </div>
          <button
            type="button"
            className="btn border border-[#d5e4ea] bg-white text-[#8a3a28] hover:bg-[#fff5f3] transition shrink-0"
            onClick={onLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Signing out…" : "Logout"}
          </button>
        </section>
      </div>
    </AppShell>
  );
}
