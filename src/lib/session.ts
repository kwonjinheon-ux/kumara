import { cookies } from "next/headers";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";

const cookieName = "korin_session";
const defaultMaxAge = 60 * 60 * 24;
const rememberedMaxAge = 60 * 60 * 24 * 30;
const secret = process.env.KORIN_SESSION_SECRET ?? "local-dev-change-me";

function sign(value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createSessionValue(userId: string, maxAge = defaultMaxAge) {
  const createdAt = Date.now();
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      nonce: randomBytes(12).toString("hex"),
      createdAt,
      expiresAt: createdAt + maxAge * 1000,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function readSessionValue(value?: string) {
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: string;
      createdAt?: number;
      expiresAt?: number;
    };

    if (!decoded.userId || !decoded.createdAt) return null;
    if (decoded.expiresAt && Date.now() > decoded.expiresAt) return null;
    if (!decoded.expiresAt && Date.now() - decoded.createdAt > rememberedMaxAge * 1000) {
      return null;
    }

    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string, rememberMe = false) {
  const cookieStore = await cookies();
  const maxAge = rememberMe ? rememberedMaxAge : defaultMaxAge;

  cookieStore.set(cookieName, createSessionValue(userId, maxAge), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const session = readSessionValue(cookieStore.get(cookieName)?.value);

  return session?.userId ?? null;
}
