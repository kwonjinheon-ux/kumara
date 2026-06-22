import { createHash, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

type PasswordResetRecord = {
  email: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
};

const dataFile = path.join(process.cwd(), "data", "password-resets.json");
const expiryMinutes = 30;

async function ensureStore() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]\n", "utf8");
  }
}

async function readRecords(): Promise<PasswordResetRecord[]> {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw) as PasswordResetRecord[];
}

async function writeRecords(records: PasswordResetRecord[]) {
  await ensureStore();
  await fs.writeFile(dataFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function createPasswordReset(input: { email: string; userId: string }) {
  const records = await readRecords();
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const nextRecords = records.filter(
    (record) => record.email !== input.email && record.userId !== input.userId,
  );

  nextRecords.push({
    email: input.email,
    userId: input.userId,
    tokenHash: hashValue(token),
    expiresAt: new Date(now.getTime() + expiryMinutes * 60 * 1000).toISOString(),
    consumedAt: null,
    createdAt: now.toISOString(),
  });
  await writeRecords(nextRecords);

  return { token, expiresInMinutes: expiryMinutes };
}

export async function consumePasswordResetToken(token: string) {
  const records = await readRecords();
  const tokenHash = hashValue(token);
  const record = records.find(
    (candidate) =>
      candidate.tokenHash === tokenHash &&
      !candidate.consumedAt &&
      new Date(candidate.expiresAt).getTime() >= Date.now(),
  );

  if (!record) return null;

  record.consumedAt = new Date().toISOString();
  await writeRecords(records);

  return { email: record.email, userId: record.userId };
}
