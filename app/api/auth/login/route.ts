import { NextResponse } from "next/server";
import { readCompany } from "@/lib/company";
import { setSessionCookie } from "@/lib/session";
import { findUserByEmail, verifyPassword } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = (body.email ?? "").trim();
    const password = body.password ?? "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(user, password))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const company = await readCompany(user.companyId);
    const setupComplete = Boolean(company?.setupComplete);
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      setupComplete,
    });

    return NextResponse.json({
      ok: true,
      redirectTo: setupComplete ? "/dashboard" : "/setup",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
