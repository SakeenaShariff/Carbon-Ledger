export async function sendEmail(params: { to: string; subject: string; text: string; html: string }): Promise<boolean> {
  const provider = (process.env.EMAIL_PROVIDER ?? "").toLowerCase();
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!provider || !apiKey || !from) {
    console.warn("[email] EMAIL_PROVIDER/EMAIL_API_KEY/EMAIL_FROM not configured. Message not sent.");
    console.warn(`[email] to=${params.to} subject=${params.subject}`);
    console.warn(params.text);
    return false;
  }

  if (provider === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to send email: ${body}`);
    }
    return true;
  }

  throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}. Use "resend".`);
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
