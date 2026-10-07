import { NextResponse } from "next/server";
import { jsonError, requireCompany } from "@/lib/auth";
import { readCompany, updateCompany } from "@/lib/company";
import { findUserById } from "@/lib/users";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { session, company } = await requireCompany();
    const user = await findUserById(session.userId);

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        createdAt: user?.createdAt ?? "",
      },
      company: {
        id: company.id,
        name: company.name,
        industry: company.industry,
        employeeCount: company.employeeCount,
        facilityCount: company.facilityCount,
        facilities: company.facilities,
        setupComplete: company.setupComplete,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { session } = await requireCompany();
    const body = (await request.json()) as {
      name?: string;
      industry?: string;
      employeeCount?: number;
    };

    const name = body.name !== undefined ? body.name.trim() : undefined;
    const industry = body.industry !== undefined ? body.industry.trim() : undefined;
    const employeeCount = body.employeeCount !== undefined ? Number(body.employeeCount) : undefined;

    if (name !== undefined && !name) {
      return NextResponse.json({ error: "Company name cannot be empty." }, { status: 400 });
    }
    if (industry !== undefined && !industry) {
      return NextResponse.json({ error: "Industry cannot be empty." }, { status: 400 });
    }
    if (employeeCount !== undefined && (!Number.isFinite(employeeCount) || employeeCount < 1)) {
      return NextResponse.json({ error: "Employee count must be a positive number." }, { status: 400 });
    }

    const updated = await updateCompany({
      companyId: session.companyId,
      name,
      industry,
      employeeCount,
    });

    return NextResponse.json({ ok: true, company: updated });
  } catch (error) {
    return jsonError(error);
  }
}
