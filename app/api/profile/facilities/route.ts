import { NextResponse } from "next/server";
import { jsonError, requireCompany } from "@/lib/auth";
import { addCompanyFacility, removeCompanyFacility, updateCompanyFacility } from "@/lib/company";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { session } = await requireCompany();
    const body = (await request.json()) as { name?: string; address?: string };

    const name = (body.name ?? "").trim();
    const address = (body.address ?? "").trim();

    if (!name) return NextResponse.json({ error: "Facility name is required." }, { status: 400 });
    if (!address) return NextResponse.json({ error: "Facility address is required." }, { status: 400 });

    const result = await addCompanyFacility({
      companyId: session.companyId,
      name,
      address,
    });

    return NextResponse.json({ ok: true, company: result.company, facility: result.facility });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { session } = await requireCompany();
    const body = (await request.json()) as { id?: string; name?: string; address?: string };

    const facilityId = (body.id ?? "").trim();
    const name = (body.name ?? "").trim();
    const address = (body.address ?? "").trim();

    if (!facilityId) return NextResponse.json({ error: "Facility ID is required." }, { status: 400 });
    if (!name) return NextResponse.json({ error: "Facility name is required." }, { status: 400 });
    if (!address) return NextResponse.json({ error: "Facility address is required." }, { status: 400 });

    const updated = await updateCompanyFacility({
      companyId: session.companyId,
      facilityId,
      name,
      address,
    });

    return NextResponse.json({ ok: true, company: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { session } = await requireCompany();
    const body = (await request.json()) as { id?: string };
    const facilityId = (body.id ?? "").trim();

    if (!facilityId) return NextResponse.json({ error: "Facility ID is required." }, { status: 400 });

    const updated = await removeCompanyFacility({
      companyId: session.companyId,
      facilityId,
    });

    return NextResponse.json({ ok: true, company: updated });
  } catch (error) {
    return jsonError(error);
  }
}
