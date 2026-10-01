"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, AuthCard, Field } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to sign in");
      return;
    }
    router.push(data.redirectTo ?? "/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue your Scope 1 and Scope 2 reporting."
      footer={
        <>
          Need an account?{" "}
          <Link className="text-primary" href="/signup">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <div className="mb-4 text-right">
          <Link className="text-sm text-primary" href="/forgot-password">
            Forgot password?
          </Link>
        </div>
        {error ? (
          <div className="mb-4">
            <Alert tone="error">
              <p>{error}</p>
            </Alert>
          </div>
        ) : null}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}
