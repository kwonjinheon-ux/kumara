import { createHash, randomBytes, randomInt } from "crypto";
import { promises as fs } from "fs";
import path from "path";

type EmailVerificationRecord = {
  email: string;
  codeHash: string;
  verificationToken: string;
  expiresAt: string;
  verifiedAt: string | null;
  consumedAt: string | null;
  createdAt: string;
};

const dataFile = path.join(process.cwd(), "data", "email-verifications.json");
const expiryMinutes = 10;

async function ensureStore() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]\n", "utf8");
  }
}

async function readRecords(): Promise<EmailVerificationRecord[]> {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw) as EmailVerificationRecord[];
}

async function writeRecords(records: EmailVerificationRecord[]) {
  await ensureStore();
  await fs.writeFile(dataFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createVerificationCode() {
  return String(randomInt(100000, 1000000));
}

export async function createEmailVerification(email: string) {
  const records = await readRecords();
  const code = createVerificationCode();
  const now = new Date();
  const record: EmailVerificationRecord = {
    email,
    codeHash: hashValue(code),
    verificationToken: randomBytes(32).toString("hex"),
    expiresAt: new Date(now.getTime() + expiryMinutes * 60 * 1000).toISOString(),
    verifiedAt: null,
    consumedAt: null,
    createdAt: now.toISOString(),
  };
  const nextRecords = records.filter((candidate) => candidate.email !== email);
  nextRecords.push(record);
  await writeRecords(nextRecords);

  return { code, expiresInMinutes: expiryMinutes };
}

export async function verifyEmailCode(email: string, code: string) {
  const records = await readRecords();
  const record = records.find((candidate) => candidate.email === email);

  if (!record || record.consumedAt || new Date(record.expiresAt).getTime() < Date.now()) {
    return null;
  }

  if (record.codeHash !== hashValue(code)) {
    return null;
  }

  record.verifiedAt = new Date().toISOString();
  await writeRecords(records);

  return { verificationToken: record.verificationToken };
}

export async function consumeVerifiedEmailToken(email: string, token: string) {
  const records = await readRecords();
  const record = records.find(
    (candidate) =>
      candidate.email === email &&
      candidate.verificationToken === token &&
      candidate.verifiedAt &&
      !candidate.consumedAt &&
      new Date(candidate.expiresAt).getTime() >= Date.now(),
  );

  if (!record) return false;

  record.consumedAt = new Date().toISOString();
  await writeRecords(records);
  return true;
}
