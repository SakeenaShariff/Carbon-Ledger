import { NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/auth";
import { readCompany } from "@/lib/company";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireSession();
    const company = await readCompany(session.companyId);
    return NextResponse.json({
      user: { id: session.userId, email: session.email, companyId: session.companyId },
      setupComplete: Boolean(company?.setupComplete),
      company: company
        ? {
            id: company.id,
            name: company.name,
            facilities: company.facilities,
          }
        : null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
