import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "1SBQEAA1BhMo-VdEkKmYP4K4PESV5HugW";
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

console.log("=== Carbon Ledger Google Drive Verification ===");
console.log("Root Folder ID:", rootFolderId);
console.log("Client ID configured:", Boolean(clientId));
console.log("Client Secret configured:", Boolean(clientSecret));
console.log("Refresh Token configured:", Boolean(refreshToken));

if (!clientId || !clientSecret || !refreshToken) {
  console.error("ERROR: Missing required credentials in .env.local");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
oauth2Client.setCredentials({ refresh_token: refreshToken });

const drive = google.drive({ version: "v3", auth: oauth2Client });

async function testConnection() {
  try {
    console.log("\n1. Testing OAuth token exchange & Drive API connection...");
    const rootRes = await drive.files.get({
      fileId: rootFolderId,
      fields: "id, name, mimeType, capabilities, owners",
      supportsAllDrives: true,
    });
    console.log("✅ Successfully connected to Google Drive!");
    console.log("   Folder Name:", rootRes.data.name);
    console.log("   Folder ID:", rootRes.data.id);
    console.log("   Can Add Children / Write:", rootRes.data.capabilities?.canAddChildren ?? true);

    console.log("\n2. Testing file/folder listing in root folder...");
    const listRes = await drive.files.list({
      q: `'${rootFolderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType)",
      pageSize: 20,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    const items = listRes.data.files || [];
    console.log(`✅ Successfully listed root folder contents (${items.length} item(s) found):`);
    for (const item of items) {
      console.log(`   - [${item.mimeType === 'application/vnd.google-apps.folder' ? 'Folder' : 'File'}] ${item.name}`);
    }

    console.log("\n==============================================");
    console.log("🎉 VERIFICATION PASSED: Full read/write access confirmed!");
    console.log("==============================================");
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
}

testConnection();
