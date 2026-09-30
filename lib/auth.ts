import { NextResponse } from "next/server";
import { getSession } from "./session";
import { readCompany } from "./company";
import type { CompanyProfile, SessionPayload } from "./types";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return session;
}

export async function requireCompany(): Promise<{ session: SessionPayload; company: CompanyProfile }> {
  const session = await requireSession();
  const company = await readCompany(session.companyId);
  if (!company || company.id !== session.companyId) {
    throw Object.assign(new Error("Company not found"), { status: 403 });
  }
  return { session, company };
}

export async function requireSetupComplete(): Promise<{ session: SessionPayload; company: CompanyProfile }> {
  const ctx = await requireCompany();
  if (!ctx.company.setupComplete) {
    throw Object.assign(new Error("Company setup is required"), { status: 403 });
  }
  return ctx;
}

export function jsonError(error: unknown): NextResponse {
  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: status || 500 });
}
