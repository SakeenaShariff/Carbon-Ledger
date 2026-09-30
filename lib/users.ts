import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { createFolder, findChild, getRootFolderId, readJson, withLock, writeJson } from "./drive";
import type { UserRecord } from "./types";

const USERS_FILE = "users.json";

type UsersFile = { users: UserRecord[] };

async function usersFolderId(): Promise<string> {
  return createFolder(getRootFolderId(), "users");
}

export async function readUsers(): Promise<UserRecord[]> {
  const folderId = await usersFolderId();
  const file = await findChild(folderId, USERS_FILE);
  if (!file) return [];
  const data = await readJson<UsersFile>(file.id);
  return data.users ?? [];
}

export async function writeUsers(users: UserRecord[]): Promise<void> {
  const folderId = await usersFolderId();
  await writeJson(folderId, USERS_FILE, { users });
}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const users = await readUsers();
  return users.find((u) => u.email === email.toLowerCase().trim());
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  const users = await readUsers();
  return users.find((u) => u.id === id);
}

export async function emailExists(email: string): Promise<boolean> {
  const user = await findUserByEmail(email);
  return Boolean(user);
}

export async function createUser(email: string, password: string, companyId: string): Promise<UserRecord> {
  return withLock("users.json", async () => {
    const users = await readUsers();
    const normalized = email.toLowerCase().trim();
    if (users.some((u) => u.email === normalized)) {
      throw new Error("An account with this email already exists.");
    }
    const user: UserRecord = {
      id: randomUUID(),
      email: normalized,
      passwordHash: await bcrypt.hash(password, 12),
      companyId,
      createdAt: new Date().toISOString(),
      passwordReset: null,
    };
    users.push(user);
    await writeUsers(users);
    return user;
  });
}

export async function verifyPassword(user: UserRecord, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

export async function setPassword(userId: string, password: string): Promise<void> {
  await withLock("users.json", async () => {
    const users = await readUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index < 0) throw new Error("User not found");
    users[index] = {
      ...users[index],
      passwordHash: await bcrypt.hash(password, 12),
      passwordReset: null,
    };
    await writeUsers(users);
  });
}

export async function createPasswordReset(email: string): Promise<{ rawToken: string; user: UserRecord } | null> {
  return withLock("users.json", async () => {
    const users = await readUsers();
    const index = users.findIndex((u) => u.email === email.toLowerCase().trim());
    if (index < 0) return null;
    const rawToken = randomBytes(32).toString("hex");
    users[index] = {
      ...users[index],
      passwordReset: {
        tokenHash: await bcrypt.hash(rawToken, 10),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    };
    await writeUsers(users);
    return { rawToken, user: users[index] };
  });
}

export async function consumePasswordReset(email: string, rawToken: string, newPassword: string): Promise<void> {
  await withLock("users.json", async () => {
    const users = await readUsers();
    const index = users.findIndex((u) => u.email === email.toLowerCase().trim());
    if (index < 0) throw new Error("Invalid or expired reset link.");
    const reset = users[index].passwordReset;
    if (!reset) throw new Error("Invalid or expired reset link.");
    if (new Date(reset.expiresAt).getTime() < Date.now()) {
      users[index] = { ...users[index], passwordReset: null };
      await writeUsers(users);
      throw new Error("This reset link has expired.");
    }
    const matches = await bcrypt.compare(rawToken, reset.tokenHash);
    if (!matches) throw new Error("Invalid or expired reset link.");
    users[index] = {
      ...users[index],
      passwordHash: await bcrypt.hash(newPassword, 12),
      passwordReset: null,
    };
    await writeUsers(users);
  });
}
