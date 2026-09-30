"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Alert, AuthCard, Field } from "@/components/ui";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to reset password");
      return;
    }
    setSuccess("Password updated. You can sign in now.");
    setTimeout(() => router.push("/login"), 1200);
  }

  if (!token || !email) {
    return <Alert tone="error">This reset link is missing required information.</Alert>;
  }

  return (
    <form onSubmit={onSubmit}>
      <Field label="New password">
        <input
          className="input"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}
      {success ? <div className="mb-4"><Alert tone="success">{success}</Alert></div> : null}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      subtitle="Choose a new password. This link can be used only once."
      footer={
        <Link className="text-primary" href="/login">
          Back to sign in
        </Link>
      }
    >
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </AuthCard>
  );
}
