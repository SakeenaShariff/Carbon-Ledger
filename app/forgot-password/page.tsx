"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Alert, AuthCard, Field } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devResetLink, setDevResetLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setDevResetLink("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to send reset email");
      return;
    }
    setMessage(data.message);
    if (data.devResetLink) setDevResetLink(data.devResetLink);
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email and we will send a one-time reset link."
      footer={
        <Link className="text-primary" href="/login">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit}>
        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}
        {message ? <div className="mb-4"><Alert tone="success">{message}</Alert></div> : null}
        {devResetLink ? (
          <div className="mb-4">
            <Alert tone="info">
              Email is not configured. Development reset link:{" "}
              <a className="text-primary underline" href={devResetLink}>
                Reset password
              </a>
            </Alert>
          </div>
        ) : null}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthCard>
  );
}
