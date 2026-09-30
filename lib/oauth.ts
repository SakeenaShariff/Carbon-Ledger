import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { google } from "googleapis";

const GOOGLE_TOKEN_COOKIE = "cl_google_tokens";
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

export type GoogleTokens = {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string | null;
  token_type?: string | null;
  expiry_date?: number | null;
  email?: string | null;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    return "carbon-ledger-default-secret-change-in-prod";
  }
  return secret;
}

function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

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
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured in .env.local to connect Google Drive.",
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

export async function setGoogleTokensCookie(tokens: GoogleTokens): Promise<void> {
  const jar = await cookies();
  const raw = JSON.stringify(tokens);
  const payloadB64 = toBase64Url(raw);
  const signed = `${payloadB64}.${sign(payloadB64)}`;

  jar.set(GOOGLE_TOKEN_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_TTL_SECONDS,
  });
}

export async function clearGoogleTokensCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(GOOGLE_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getGoogleTokens(): Promise<GoogleTokens | null> {
  try {
    const jar = await cookies();
    const tokenCookie = jar.get(GOOGLE_TOKEN_COOKIE)?.value;

    if (tokenCookie) {
      const [payloadB64, signature] = tokenCookie.split(".");
      if (payloadB64 && signature) {
        const expected = sign(payloadB64);
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length === b.length && timingSafeEqual(a, b)) {
          const raw = Buffer.from(payloadB64, "base64url").toString("utf8");
          const parsed = JSON.parse(raw) as GoogleTokens;
          if (parsed.refresh_token || parsed.access_token) {
            return parsed;
          }
        }
      }
    }
  } catch {
    // ignore cookie reading errors
  }

  // Fallback to environment variable if provided
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    return {
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      email: process.env.GOOGLE_ACCOUNT_EMAIL || "Configured in environment",
    };
  }

  return null;
}
