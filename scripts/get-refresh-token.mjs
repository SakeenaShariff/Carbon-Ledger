#!/usr/bin/env node
/**
 * Administrator Google Refresh Token Generator
 * 
 * Run this one-time script if you use a personal Google account (@gmail.com)
 * to generate a permanent server-side GOOGLE_REFRESH_TOKEN.
 * 
 * Usage:
 *   node scripts/get-refresh-token.mjs
 */

import http from "http";
import url from "url";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const clientId = env.GOOGLE_CLIENT_ID;
const clientSecret = env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("\n❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local\n");
  process.exit(1);
}

const redirectUriString = env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";
let redirectParsed;
try {
  redirectParsed = new URL(redirectUriString);
} catch {
  redirectParsed = new URL("http://localhost:3000/api/auth/google/callback");
}

const PORT = Number(redirectParsed.port) || 3000;
const CALLBACK_PATH = redirectParsed.pathname || "/api/auth/google/callback";

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUriString);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive"],
});

console.log("\n==================================================");
console.log("   Google Drive Administrator Authorization");
console.log("==================================================");
console.log(`Using Redirect URI: ${redirectUriString}`);
console.log("\n1. Open the following URL in your browser:\n");
console.log(authUrl);
console.log("\n2. Log in with your Administrator Google account.");
console.log("3. Click Allow to grant Drive access.");
console.log("4. Waiting for callback on port " + PORT + "...\n");

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  // Match the configured callback path or /oauth2callback
  if (parsed.pathname === CALLBACK_PATH || parsed.pathname === "/oauth2callback" || parsed.pathname.includes("callback")) {
    const code = parsed.query.code;
    const error = parsed.query.error;

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end(`<h2>Authorization Error: ${error}</h2>`);
      console.error("\n❌ Authorization was denied: " + error);
      server.close();
      return;
    }

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end("<h2>Missing authorization code</h2>");
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<h2>Success! You can close this window now. Check your terminal.</h2>");

      console.log("\n==================================================");
      console.log("   ✅ SUCCESS! Refresh Token Generated");
      console.log("==================================================\n");
      console.log("Add this to your .env.local file and Vercel Environment Variables:\n");
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
      console.log("==================================================\n");
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(`<h2>Token Exchange Failed: ${err.message}</h2>`);
      console.error("\n❌ Token exchange failed: " + err.message);
    } finally {
      server.close();
    }
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT);

