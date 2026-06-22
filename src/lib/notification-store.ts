import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import type { NotificationType, PublicNotification, StoredNotification } from "@/types/notification";

const dataFile = path.join(process.cwd(), "data", "notifications.json");
const readRetentionMs = 7 * 24 * 60 * 60 * 1000;
const hiddenManagedTypes = new Set(["comment"]);

async function ensureStore() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]\n", "utf8");
  }
}

async function readNotifications(): Promise<StoredNotification[]> {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw) as StoredNotification[];
}

async function writeNotifications(notifications: StoredNotification[]) {
  await ensureStore();
  await fs.writeFile(dataFile, `${JSON.stringify(notifications, null, 2)}\n`, "utf8");
}

function normalizeText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return text ? text.slice(0, maxLength) : null;
}

function shouldKeep(notification: StoredNotification, now = Date.now()) {
  if (!notification.isRead) return true;
  if (!notification.readAt) return true;

  return now - new Date(notification.readAt).getTime() < readRetentionMs;
}

async function purgeExpiredReadNotifications(notifications?: StoredNotification[]) {
  const currentNotifications = notifications ?? await readNotifications();
  const nextNotifications = currentNotifications.filter((notification) => shouldKeep(notification));

  if (nextNotifications.length !== currentNotifications.length) {
    await writeNotifications(nextNotifications);
  }

  return nextNotifications;
}

function toPublicNotification(notification: StoredNotification): PublicNotification {
  const { userId: _userId, ...publicNotification } = notification;
  return publicNotification;
}

export async function getUserNotifications(userId: string) {
  const notifications = await purgeExpiredReadNotifications();

  return notifications
    .filter((notification) => notification.userId === userId && !hiddenManagedTypes.has(notification.type))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPublicNotification);
}

export async function getUnreadNotificationCount(userId: string) {
  const notifications = await purgeExpiredReadNotifications();

  return notifications.filter(
    (notification) => notification.userId === userId && !notification.isRead && !hiddenManagedTypes.has(notification.type),
  ).length;
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  targetType?: string | null;
  targetId?: string | null;
}) {
  const notifications = await purgeExpiredReadNotifications();
  const now = new Date().toISOString();
  const notification: StoredNotification = {
    id: randomUUID(),
    userId: input.userId,
    type: input.type,
    title: normalizeText(input.title, 80) ?? "새 알림",
    message: normalizeText(input.message, 240) ?? "새로운 알림이 있습니다.",
    targetType: normalizeText(input.targetType, 40),
    targetId: normalizeText(input.targetId, 80),
    isRead: false,
    readAt: null,
    createdAt: now,
    updatedAt: now,
  };

  notifications.push(notification);
  await writeNotifications(notifications);

  return getUserNotifications(input.userId);
}

export async function updateNotification(
  userId: string,
  notificationId: string,
  input: {
    title?: unknown;
    message?: unknown;
    isRead?: unknown;
  },
) {
  const notifications = await purgeExpiredReadNotifications();
  const notification = notifications.find(
    (item) => item.id === notificationId && item.userId === userId,
  );

  if (!notification) return null;

  const title = normalizeText(input.title, 80);
  const message = normalizeText(input.message, 240);
  const now = new Date().toISOString();

  if (title) notification.title = title;
  if (message) notification.message = message;
  if (typeof input.isRead === "boolean") {
    notification.isRead = input.isRead;
    notification.readAt = input.isRead ? notification.readAt ?? now : null;
  }
  notification.updatedAt = now;

  await writeNotifications(notifications);

  return getUserNotifications(userId);
}

export async function deleteNotification(userId: string, notificationId: string) {
  const notifications = await purgeExpiredReadNotifications();
  const nextNotifications = notifications.filter(
    (notification) => !(notification.id === notificationId && notification.userId === userId),
  );

  if (nextNotifications.length === notifications.length) return null;

  await writeNotifications(nextNotifications);
  return getUserNotifications(userId);
}

export async function deleteAllNotifications(userId: string) {
  const notifications = await purgeExpiredReadNotifications();
  const nextNotifications = notifications.filter((notification) => notification.userId !== userId);

  await writeNotifications(nextNotifications);
  return [];
}

export async function markAllNotificationsRead(userId: string) {
  const notifications = await purgeExpiredReadNotifications();
  const now = new Date().toISOString();

  for (const notification of notifications) {
    if (notification.userId !== userId || notification.isRead) continue;

    notification.isRead = true;
    notification.readAt = now;
    notification.updatedAt = now;
  }

  await writeNotifications(notifications);
  return getUserNotifications(userId);
}
