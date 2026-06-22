import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

import { hashPassword, verifyPassword } from "@/lib/password";
import { isEmail } from "@/lib/validation";
import {
  defaultMembershipLevel,
  getMembershipBenefits,
} from "@/config/membershipLevels";
import type { PublicUser, StoredUser } from "@/types/user";

const dataFile = path.join(process.cwd(), "data", "users.json");
let cachedUsers: StoredUser[] | null = null;

function getDefaultProfile(): StoredUser["profile"] {
  return {
    profileImageUrl: null,
    profileImageScale: 1,
    profileImageX: 0,
    profileImageY: 0,
    smartphoneNumber: null,
    kakaoTalkId: null,
    bio: null,
    city: null,
    suburb: null,
    showKakaoTalkId: false,
    showPhoneNumber: false,
    allowChat: true,
    interests: [],
    preferredLanguage: "ko",
    notificationComments: false,
    notificationSavedPosts: false,
    notificationTradeMessages: false,
    tradeArea: null,
    businessInterested: false,
    businessName: null,
    businessDescription: null,
    residencyStatus: null,
    hasCar: null,
    lifeInfoInterests: [],
  };
}

function normalizeProfile(profile: Partial<StoredUser["profile"]> | null | undefined) {
  return {
    ...getDefaultProfile(),
    ...(profile ?? {}),
  };
}

async function ensureStore() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]\n", "utf8");
  }
}

async function readUsers(): Promise<StoredUser[]> {
  if (cachedUsers) return cachedUsers;

  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf8");
  cachedUsers = JSON.parse(raw) as StoredUser[];

  return cachedUsers;
}

async function writeUsers(users: StoredUser[]) {
  await ensureStore();
  cachedUsers = users;
  await fs.writeFile(dataFile, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    nickname: user.nickname,
    referralId: user.referralId ?? null,
    profile: normalizeProfile(user.profile),
    role: user.role,
    membershipLevel: user.membershipLevel ?? defaultMembershipLevel,
    membershipBenefits: getMembershipBenefits(user.membershipLevel ?? defaultMembershipLevel),
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt,
  };
}

export async function createUser(input: {
  loginId: string;
  password: string;
  nickname: string;
  referralId: string | null;
  profile: StoredUser["profile"];
  isEmailVerified?: boolean;
}) {
  const users = await readUsers();
  const loginId = input.loginId.toLowerCase();
  const normalizedNickname = input.nickname.trim();
  const loginExists = users.some(
    (user) => user.email === loginId,
  );
  const nicknameExists = users.some(
    (user) => user.nickname.toLowerCase() === normalizedNickname.toLowerCase(),
  );

  if (loginExists) {
    throw new Error("이미 가입된 이메일입니다.");
  }

  if (nicknameExists) {
    throw new Error("이미 사용 중인 닉네임입니다.");
  }

  const now = new Date().toISOString();
  const user: StoredUser = {
    id: randomUUID(),
    email: isEmail(loginId) ? loginId : null,
    phone: input.profile.smartphoneNumber,
    nickname: normalizedNickname,
    referralId: input.referralId,
    profile: normalizeProfile(input.profile),
    role: "member",
    membershipLevel: defaultMembershipLevel,
    status: input.isEmailVerified ? "active" : "pending_verification",
    isEmailVerified: input.isEmailVerified ?? false,
    isPhoneVerified: false,
    passwordHash: await hashPassword(input.password),
    acceptedTermsAt: now,
    confirmedAge14At: now,
    createdAt: now,
  };

  users.push(user);
  await writeUsers(users);

  return toPublicUser(user);
}

export async function findOrCreateGoogleUser(input: {
  email: string;
  googleId: string;
  name: string;
  picture: string | null;
}) {
  const users = await readUsers();
  const normalizedEmail = input.email.toLowerCase();
  const now = new Date().toISOString();
  const existingUser = users.find(
    (candidate) => candidate.googleId === input.googleId || candidate.email === normalizedEmail,
  );

  if (existingUser) {
    existingUser.googleId = input.googleId;
    existingUser.authProvider = existingUser.authProvider ?? "google";
    existingUser.isEmailVerified = true;
    existingUser.status = existingUser.status === "pending_verification" ? "active" : existingUser.status;
    existingUser.profile = normalizeProfile({
      ...existingUser.profile,
      profileImageUrl: existingUser.profile?.profileImageUrl ?? input.picture,
    });

    await writeUsers(users);
    return toPublicUser(existingUser);
  }

  const baseNickname = (input.name || normalizedEmail.split("@")[0] || "Google user")
    .trim()
    .slice(0, 20);
  let nickname = baseNickname || "Google user";
  let suffix = 2;

  while (users.some((candidate) => candidate.nickname.toLowerCase() === nickname.toLowerCase())) {
    const nextSuffix = String(suffix);
    nickname = `${baseNickname.slice(0, Math.max(1, 20 - nextSuffix.length))}${nextSuffix}`;
    suffix += 1;
  }

  const user: StoredUser = {
    id: randomUUID(),
    email: normalizedEmail,
    phone: null,
    nickname,
    referralId: null,
    profile: normalizeProfile({
      profileImageUrl: input.picture,
    }),
    role: "member",
    membershipLevel: defaultMembershipLevel,
    status: "active",
    isEmailVerified: true,
    isPhoneVerified: false,
    passwordHash: await hashPassword(randomUUID()),
    acceptedTermsAt: now,
    confirmedAge14At: now,
    authProvider: "google",
    googleId: input.googleId,
    createdAt: now,
  };

  users.push(user);
  await writeUsers(users);

  return toPublicUser(user);
}

export async function authenticateUser(loginId: string, password: string) {
  const users = await readUsers();
  const normalizedLoginId = loginId.toLowerCase();
  const user = users.find(
    (candidate) => candidate.email === normalizedLoginId,
  );

  if (!user) return null;
  if (user.status === "suspended" || user.status === "deleted") return null;

  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? toPublicUser(user) : null;
}

export async function findUserByEmail(email: string) {
  const users = await readUsers();
  const normalizedEmail = email.toLowerCase();
  const user = users.find((candidate) => candidate.email === normalizedEmail);

  return user ? toPublicUser(user) : null;
}

export async function findUserByEmailOrNickname(value: string) {
  const users = await readUsers();
  const normalizedValue = value.trim().toLowerCase();
  const user = users.find(
    (candidate) =>
      candidate.email?.toLowerCase() === normalizedValue ||
      candidate.nickname.toLowerCase() === normalizedValue,
  );

  return user ? toPublicUser(user) : null;
}

export async function findUserById(userId: string) {
  const users = await readUsers();
  const user = users.find((candidate) => candidate.id === userId);

  return user ? toPublicUser(user) : null;
}

export async function findUsersByIds(userIds: string[]) {
  const ids = new Set(userIds);

  if (!ids.size) return [];

  const users = await readUsers();

  return users
    .filter((candidate) => ids.has(candidate.id))
    .map(toPublicUser);
}

export async function updateUserProfile(
  userId: string,
  input: {
    nickname: string;
    phone: string | null;
    profile: Partial<StoredUser["profile"]>;
  },
) {
  const users = await readUsers();
  const user = users.find((candidate) => candidate.id === userId);

  if (!user || user.status === "deleted") {
    return null;
  }

  const nickname = input.nickname.trim();
  const nicknameExists = users.some(
    (candidate) =>
      candidate.id !== userId &&
      candidate.nickname.toLowerCase() === nickname.toLowerCase(),
  );

  if (nicknameExists) {
    throw new Error("이미 사용 중인 닉네임입니다.");
  }

  user.nickname = nickname;
  user.phone = input.phone;
  user.profile = normalizeProfile({
    ...user.profile,
    ...input.profile,
    smartphoneNumber: input.phone,
  });

  await writeUsers(users);

  return toPublicUser(user);
}

export async function updateUserPassword(userId: string, password: string) {
  const users = await readUsers();
  const user = users.find((candidate) => candidate.id === userId);

  if (!user || user.status === "deleted") {
    return false;
  }

  user.passwordHash = await hashPassword(password);
  await writeUsers(users);

  return true;
}
