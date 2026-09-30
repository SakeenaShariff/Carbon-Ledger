"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, AuthCard, Field } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to create account");
      return;
    }
    router.push(data.redirectTo ?? "/setup");
    router.refresh();
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start by signing up. You will set up your company next."
      footer={
        <>
          Already have an account?{" "}
          <Link className="text-primary" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <input
            className="input"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        {error ? (
          <div className="mb-4">
            <Alert tone="error">
              <p>{error}</p>
              {error.includes("Google Drive") ? (
                <a
                  href="/api/auth/google/connect?returnTo=/signup"
                  className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-xs font-medium text-white hover:brightness-105"
                >
                  Connect Google Drive Now
                </a>
              ) : null}
            </Alert>
          </div>
        ) : null}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>
    </AuthCard>
  );
}
