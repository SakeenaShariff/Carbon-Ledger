import { google } from "googleapis";

export type GoogleTokens = {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string | null;
  token_type?: string | null;
  expiry_date?: number | null;
  email?: string | null;
};

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function getRedirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI || `${getAppUrl()}/api/auth/google/callback`;
}

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getRedirectUri();

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured in environment variables.",
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function generateGoogleAuthUrl(returnTo = "/dashboard"): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state: Buffer.from(JSON.stringify({ returnTo })).toString("base64url"),
  });
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  let email: string | null = null;
  if (tokens.access_token) {
    try {
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      email = userInfo.data.email ?? null;
    } catch {
      // email fetch is optional
    }
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    token_type: tokens.token_type,
    expiry_date: tokens.expiry_date,
    email,
  };
}
