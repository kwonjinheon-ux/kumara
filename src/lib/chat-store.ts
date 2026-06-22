import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { createNotification } from "@/lib/notification-store";
import { findUserById, findUsersByIds } from "@/lib/user-store";
import { getMarketPostById } from "@/lib/marketplace-store";
import type { PublicUser } from "@/types/user";
import type { PublicChatRoom, StoredChatRoom } from "@/types/chat";

const dataFile = path.join(process.cwd(), "data", "chats.json");

async function ensureStore() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]\n", "utf8");
  }
}

async function readChats(): Promise<StoredChatRoom[]> {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw) as StoredChatRoom[];
}

async function writeChats(chats: StoredChatRoom[]) {
  await ensureStore();
  await fs.writeFile(dataFile, `${JSON.stringify(chats, null, 2)}\n`, "utf8");
}

function isParticipant(chat: StoredChatRoom, userId: string) {
  return chat.buyerId === userId || chat.sellerId === userId;
}

function hasLeftChat(chat: StoredChatRoom, userId: string) {
  return chat.buyerId === userId ? Boolean(chat.buyerLeftAt) : Boolean(chat.sellerLeftAt);
}

function otherUserId(chat: StoredChatRoom, userId: string) {
  return chat.buyerId === userId ? chat.sellerId : chat.buyerId;
}

async function toPublicChat(
  chat: StoredChatRoom,
  userId: string,
  usersById?: Map<string, PublicUser>,
): Promise<PublicChatRoom | null> {
  if (hasLeftChat(chat, userId)) return null;

  const otherId = otherUserId(chat, userId);
  const otherUser = usersById?.get(otherId) ?? await findUserById(otherId);

  if (!otherUser) return null;

  const lastMessage = chat.messages.at(-1);
  const unreadCount = chat.messages.filter(
    (message) => message.senderId !== userId && !message.isRead,
  ).length;

  return {
    id: chat.id,
    postId: chat.postId,
    postTitle: chat.postTitle,
    otherUser: {
      id: otherUser.id,
      nickname: otherUser.nickname,
      email: otherUser.email,
      profileImageUrl: otherUser.profile.profileImageUrl,
    },
    lastMessage: lastMessage?.message ?? "아직 메시지가 없습니다.",
    lastMessageAt: lastMessage?.createdAt ?? chat.updatedAt,
    unreadCount,
    messages: chat.messages.map((message) => ({
      ...message,
      isMine: message.senderId === userId,
    })),
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  };
}

async function toPublicChats(chats: StoredChatRoom[], userId: string) {
  const visibleChats = chats.filter((chat) => !hasLeftChat(chat, userId));
  const users = await findUsersByIds(visibleChats.map((chat) => otherUserId(chat, userId)));
  const usersById = new Map(users.map((user) => [user.id, user]));
  const publicChats = await Promise.all(visibleChats.map((chat) => toPublicChat(chat, userId, usersById)));

  return publicChats
    .filter((chat): chat is PublicChatRoom => Boolean(chat))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getUserChats(userId: string) {
  const chats = await readChats();
  return toPublicChats(chats.filter((chat) => isParticipant(chat, userId)), userId);
}

export async function createOrGetChat(input: {
  currentUser: PublicUser;
  recipient: PublicUser;
  postId?: string | null;
  postTitle?: string | null;
  initialMessage?: string | null;
}) {
  if (input.currentUser.id === input.recipient.id) {
    throw new Error("본인에게는 1:1 채팅을 시작할 수 없습니다.");
  }

  const postAllowsChat = input.postId
    ? await doesPostAllowKorinChat(input.postId, input.recipient.id)
    : false;

  if (!input.recipient.profile.allowChat && !postAllowsChat) {
    throw new Error("판매자가 채팅을 허용하지 않았습니다.");
  }

  const chats = await readChats();
  const postId = input.postId ?? null;
  const postTitle = normalizeText(input.postTitle, 80) ?? "일반 문의";
  const existing = chats.find(
    (chat) =>
      ((chat.buyerId === input.currentUser.id && chat.sellerId === input.recipient.id) ||
        (chat.buyerId === input.recipient.id && chat.sellerId === input.currentUser.id)) &&
      chat.postId === postId &&
      chat.postTitle === postTitle,
  );

  if (existing) {
    const initialMessage = normalizeText(input.initialMessage, 500);

    if (existing.buyerId === input.currentUser.id) {
      existing.buyerLeftAt = null;
    } else {
      existing.sellerLeftAt = null;
    }
    await writeChats(chats);

    if (initialMessage) {
      await addChatMessage(existing.id, input.currentUser.id, initialMessage);
    }

    const refreshed = await readChats();
    return toPublicChats(refreshed.filter((chat) => isParticipant(chat, input.currentUser.id)), input.currentUser.id);
  }

  const now = new Date().toISOString();
  const initialMessage = normalizeText(input.initialMessage, 500);
  const chat: StoredChatRoom = {
    id: randomUUID(),
    postId,
    postTitle,
    buyerId: input.currentUser.id,
    sellerId: input.recipient.id,
    isBuyerBlocked: false,
    isSellerBlocked: false,
    buyerLeftAt: null,
    sellerLeftAt: null,
    createdAt: now,
    updatedAt: now,
    messages: initialMessage
      ? [{
          id: randomUUID(),
          chatId: "",
          senderId: input.currentUser.id,
          message: initialMessage,
          isRead: false,
          createdAt: now,
        }]
      : [],
  };

  chat.messages = chat.messages.map((message) => ({ ...message, chatId: chat.id }));
  chats.push(chat);
  await writeChats(chats);
  if (initialMessage) {
    await createNotification({
      userId: input.recipient.id,
      type: "chat",
      title: "새 채팅방",
      message: initialMessage,
      targetType: "chat",
      targetId: chat.id,
    });
  }

  return toPublicChats(chats.filter((item) => isParticipant(item, input.currentUser.id)), input.currentUser.id);
}

async function doesPostAllowKorinChat(postId: string, recipientId: string) {
  const post = await getMarketPostById(postId);

  return Boolean(
    post
      && post.userId === recipientId
      && (post.contactMethods?.includes("korin_chat") || post.contactMethod === "korin_chat"),
  );
}

async function appendChatMessage(chatId: string, senderId: string, rawMessage: string) {
  const message = normalizeText(rawMessage, 500);

  if (!message) {
    throw new Error("메시지를 입력해 주세요.");
  }

  const chats = await readChats();
  const chat = chats.find((item) => item.id === chatId);

  if (!chat || !isParticipant(chat, senderId)) {
    return null;
  }

  if (hasLeftChat(chat, senderId)) {
    throw new Error("나간 채팅방에는 메시지를 보낼 수 없습니다.");
  }

  if (
    (chat.buyerId === senderId && chat.isBuyerBlocked) ||
    (chat.sellerId === senderId && chat.isSellerBlocked)
  ) {
    throw new Error("차단된 채팅방에는 메시지를 보낼 수 없습니다.");
  }

  const now = new Date().toISOString();
  chat.messages.push({
    id: randomUUID(),
    chatId,
    senderId,
    message,
    isRead: false,
    createdAt: now,
  });
  chat.updatedAt = now;
  await writeChats(chats);
  await createNotification({
    userId: otherUserId(chat, senderId),
    type: "chat",
    title: "새 채팅 메시지",
    message,
    targetType: "chat",
    targetId: chat.id,
  });

  return { chat, chats };
}

export async function addChatMessage(chatId: string, senderId: string, rawMessage: string) {
  const result = await appendChatMessage(chatId, senderId, rawMessage);

  if (!result) return null;

  const { chats } = result;
  return toPublicChats(chats.filter((item) => isParticipant(item, senderId)), senderId);
}

export async function addChatMessageToRoom(chatId: string, senderId: string, rawMessage: string) {
  const result = await appendChatMessage(chatId, senderId, rawMessage);

  if (!result) return null;

  return toPublicChat(result.chat, senderId);
}

export async function leaveChat(chatId: string, userId: string) {
  const chats = await readChats();
  const chat = chats.find((item) => item.id === chatId);

  if (!chat || !isParticipant(chat, userId)) return null;

  const now = new Date().toISOString();

  if (chat.buyerId === userId) {
    chat.buyerLeftAt = now;
  } else {
    chat.sellerLeftAt = now;
  }

  chat.updatedAt = now;
  await writeChats(chats);

  return toPublicChats(chats.filter((item) => isParticipant(item, userId)), userId);
}

async function markChatReadInStore(chatId: string, userId: string) {
  const chats = await readChats();
  const chat = chats.find((item) => item.id === chatId);

  if (!chat || !isParticipant(chat, userId) || hasLeftChat(chat, userId)) return null;

  let changed = false;
  chat.messages = chat.messages.map((message) => {
    if (message.senderId === userId || message.isRead) return message;
    changed = true;
    return { ...message, isRead: true };
  });

  if (changed) {
    await writeChats(chats);
  }

  return { chat, chats };
}

export async function markChatRead(chatId: string, userId: string) {
  const result = await markChatReadInStore(chatId, userId);

  if (!result) return null;

  const { chats } = result;
  return toPublicChats(chats.filter((item) => isParticipant(item, userId)), userId);
}

export async function markChatReadRoom(chatId: string, userId: string) {
  const result = await markChatReadInStore(chatId, userId);

  if (!result) return null;

  return toPublicChat(result.chat, userId);
}

function normalizeText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return text ? text.slice(0, maxLength) : null;
}
