"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function UploadPage() {
  return (
    <AppShell>
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center pt-8">
        <h1 className="mb-4 text-center font-heading text-5xl text-ink">
          Select Upload Scope
        </h1>
        <p className="mb-12 text-center text-xl text-muted">
          Choose the appropriate scope for your Excel data upload.
        </p>

        <div className="flex w-full max-w-5xl flex-col gap-8 md:flex-row">
          <Link
            href="/upload/scope1"
            className="group flex flex-1 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-xl"
          >
            <div className="mb-8 h-4 w-32 rounded-full bg-scope1 transition-transform group-hover:scale-110" />
            <h2 className="mb-4 font-heading text-4xl font-semibold text-ink">Scope 1</h2>
            <p className="text-xl text-muted">
              Stationary and mobile fuel combustion.
            </p>
          </Link>

          <Link
            href="/upload/scope2"
            className="group flex flex-1 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-xl"
          >
            <div className="mb-8 h-4 w-32 rounded-full bg-scope2 transition-transform group-hover:scale-110" />
            <h2 className="mb-4 font-heading text-4xl font-semibold text-ink">Scope 2</h2>
            <p className="text-xl text-muted">
              Purchased electricity.
            </p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
