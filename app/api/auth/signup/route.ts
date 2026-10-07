import { NextResponse } from "next/server";
import { createCompanyStub } from "@/lib/company";
import { createUser, emailExists } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = (body.email ?? "").trim();
    const password = body.password ?? "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    if (await emailExists(email)) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const company = await createCompanyStub();
    await createUser(email, password, company.id);

    return NextResponse.json({ ok: true, redirectTo: "/login" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
