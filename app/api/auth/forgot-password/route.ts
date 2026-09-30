import { NextResponse } from "next/server";
import { appUrl, sendEmail } from "@/lib/email";
import { createPasswordReset } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = (body.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const created = await createPasswordReset(email);
    let devResetLink: string | undefined;
    if (created) {
      const link = `${appUrl()}/reset-password?token=${created.rawToken}&email=${encodeURIComponent(created.user.email)}`;
      const sent = await sendEmail({
        to: created.user.email,
        subject: "Reset your Carbon Ledger password",
        text: `Use this one-time link to reset your password. It expires in 1 hour.\n\n${link}`,
        html: `<p>Use this one-time link to reset your password. It expires in 1 hour.</p><p><a href="${link}">${link}</a></p>`,
      });
      if (!sent && process.env.NODE_ENV !== "production") {
        devResetLink = link;
      }
    }

    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a reset link has been sent.",
      ...(devResetLink ? { devResetLink } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start password reset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
