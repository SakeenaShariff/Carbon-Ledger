import { Readable } from "stream";
import { google, type drive_v3 } from "googleapis";

export function getRootFolderId(): string {
  return process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "1SBQEAA1BhMo-VdEkKmYP4K4PESV5HugW";
}

const writeLocks = new Map<string, Promise<unknown>>();

export function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = writeLocks.get(key) ?? Promise.resolve();
  const next = previous.then(fn, fn);
  writeLocks.set(
    key,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}

function getServiceAccountAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (rawKey) {
      try {
        const decoded = rawKey.startsWith("{") ? rawKey : Buffer.from(rawKey, "base64").toString("utf8");
        const parsed = JSON.parse(decoded) as { client_email?: string; private_key?: string };
        if (parsed.client_email && parsed.private_key) {
          return new google.auth.JWT({
            email: parsed.client_email,
            key: parsed.private_key.replace(/\\n/g, "\n"),
            scopes: ["https://www.googleapis.com/auth/drive"],
          });
        }
      } catch {
        // ignore JSON parse error
      }
    }
    return null;
  }

  return new google.auth.JWT({
    email,
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

function getAdminOAuth2Auth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });
  return oauth2Client;
}

export function isDriveConfigured(): boolean {
  return Boolean(getServiceAccountAuth() || getAdminOAuth2Auth());
}

function getServerDriveAuth() {
  const saAuth = getServiceAccountAuth();
  if (saAuth) return saAuth;

  const oauthAuth = getAdminOAuth2Auth();
  if (oauthAuth) return oauthAuth;

  throw new Error(
    "Google Drive storage is not configured on the server. " +
      "Please configure GOOGLE_REFRESH_TOKEN (with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) or " +
      "GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in server environment variables.",
  );
}

function getDriveClient(): drive_v3.Drive {
  const auth = getServerDriveAuth();
  return google.drive({ version: "v3", auth });
}

async function driveRequest<T>(fn: (drive: drive_v3.Drive) => Promise<T>): Promise<T> {
  const drive = getDriveClient();
  try {
    return await fn(drive);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "message" in error) {
      const msg = String((error as { message?: string }).message);
      if (msg.includes("invalid_grant") || msg.includes("Token has been expired or revoked")) {
        throw new Error(
          "Server Google Drive authorization failed or expired. Please verify GOOGLE_REFRESH_TOKEN or Service Account credentials in server environment variables.",
        );
      }
    }
    throw error;
  }
}

export async function findChild(parentId: string, name: string): Promise<{ id: string; mimeType: string } | null> {
  return driveRequest(async (drive) => {
    const escaped = name.replace(/'/g, "\\'");
    const res = await drive.files.list({
      q: `'${parentId}' in parents and name = '${escaped}' and trashed = false`,
      fields: "files(id, name, mimeType)",
      pageSize: 10,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    const file = res.data.files?.[0];
    if (!file?.id) return null;
    return { id: file.id, mimeType: file.mimeType ?? "" };
  });
}

export async function createFolder(parentId: string, name: string): Promise<string> {
  const existing = await findChild(parentId, name);
  if (existing) return existing.id;

  return withLock(`create-folder:${parentId}:${name}`, async () => {
    const again = await findChild(parentId, name);
    if (again) return again.id;

    return driveRequest(async (drive) => {
      const res = await drive.files.create({
        requestBody: {
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId],
        },
        fields: "id",
        supportsAllDrives: true,
      });
      if (!res.data.id) throw new Error(`Failed to create folder ${name}`);
      return res.data.id;
    });
  });
}

export async function ensureFolderPath(parts: string[], rootId = getRootFolderId()): Promise<string> {
  let current = rootId;
  for (const part of parts) {
    current = await createFolder(current, part);
  }
  return current;
}

export async function listChildren(parentId: string): Promise<Array<{ id: string; name: string; mimeType: string }>> {
  return driveRequest(async (drive) => {
    const files: Array<{ id: string; name: string; mimeType: string }> = [];
    let pageToken: string | undefined;
    do {
      const res = await drive.files.list({
        q: `'${parentId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType)",
        pageSize: 100,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      for (const file of res.data.files ?? []) {
        if (file.id && file.name) {
          files.push({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType ?? "",
          });
        }
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
    return files;
  });
}

export async function uploadFile(params: {
  parentId: string;
  name: string;
  mimeType: string;
  body: Buffer | string;
}): Promise<string> {
  const { parentId, name, mimeType, body } = params;
  const existing = await findChild(parentId, name);
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8");
  const media = {
    mimeType,
    body: Readable.from(buffer),
  };

  return driveRequest(async (drive) => {
    if (existing) {
      const res = await drive.files.update({
        fileId: existing.id,
        media,
        fields: "id",
        supportsAllDrives: true,
      });
      if (!res.data.id) throw new Error(`Failed to update ${name}`);
      return res.data.id;
    }

    const res = await drive.files.create({
      requestBody: {
        name,
        parents: [parentId],
      },
      media,
      fields: "id",
      supportsAllDrives: true,
    });
    if (!res.data.id) throw new Error(`Failed to upload ${name}`);
    return res.data.id;
  });
}

export async function readFileBuffer(fileId: string): Promise<Buffer> {
  return driveRequest(async (drive) => {
    const res = await drive.files.get(
      {
        fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      { responseType: "arraybuffer" },
    );
    return Buffer.from(res.data as ArrayBuffer);
  });
}

export async function readJson<T>(fileId: string): Promise<T> {
  const buf = await readFileBuffer(fileId);
  return JSON.parse(buf.toString("utf8")) as T;
}

export async function readJsonByName<T>(parentId: string, name: string): Promise<T | null> {
  const file = await findChild(parentId, name);
  if (!file) return null;
  return readJson<T>(file.id);
}

export async function writeJson(parentId: string, name: string, data: unknown): Promise<string> {
  return uploadFile({
    parentId,
    name,
    mimeType: "application/json",
    body: JSON.stringify(data, null, 2),
  });
}

export async function deleteFile(fileId: string): Promise<void> {
  await driveRequest(async (drive) => {
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });
  });
}

export async function replaceFolderContents(
  parentId: string,
  files: Array<{ name: string; mimeType: string; body: Buffer | string }>,
): Promise<void> {
  await withLock(`replace:${parentId}`, async () => {
    for (const file of files) {
      await uploadFile({
        parentId,
        name: file.name,
        mimeType: file.mimeType,
        body: file.body,
      });
    }
  });
}
