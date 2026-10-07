"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Alert, AuthCard, Field } from "@/components/ui";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="relative flex items-center">
          <input
            className="input pr-11"
            type={showPassword ? "text" : "password"}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            suppressHydrationWarning
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 inline-flex items-center justify-center rounded-lg p-1 text-muted transition hover:text-ink focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
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
