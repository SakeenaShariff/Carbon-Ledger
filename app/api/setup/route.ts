import { NextResponse } from "next/server";
import { jsonError, requireCompany } from "@/lib/auth";
import { completeCompanySetup } from "@/lib/company";
import { setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { session } = await requireCompany();

    const body = (await request.json()) as {
      name?: string;
      industry?: string;
      employeeCount?: number;
      facilities?: Array<{ name?: string; address?: string }>;
    };

    const name = (body.name ?? "").trim();
    const industry = (body.industry ?? "").trim();
    const employeeCount = Number(body.employeeCount);
    const facilities = body.facilities ?? [];

    if (!name) return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    if (!industry) return NextResponse.json({ error: "Industry is required." }, { status: 400 });
    if (!Number.isFinite(employeeCount) || employeeCount < 1) {
      return NextResponse.json({ error: "Employee count must be a positive number." }, { status: 400 });
    }
    if (!facilities.length) {
      return NextResponse.json({ error: "Enter the number of facilities and complete each row." }, { status: 400 });
    }
    for (const [i, facility] of facilities.entries()) {
      if (!facility.name?.trim() || !facility.address?.trim()) {
        return NextResponse.json(
          { error: `Facility ${i + 1} needs both a name and an address.` },
          { status: 400 },
        );
      }
    }

    const saved = await completeCompanySetup({
      companyId: session.companyId,
      name,
      industry,
      employeeCount,
      facilities: facilities.map((f) => ({ name: f.name ?? "", address: f.address ?? "" })),
    });

    await setSessionCookie({
      userId: session.userId,
      email: session.email,
      companyId: session.companyId,
      setupComplete: true,
    });

    return NextResponse.json({ ok: true, company: saved });
  } catch (error) {
    return jsonError(error);
  }
}
