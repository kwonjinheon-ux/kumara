export type NotificationType =
  | "bookmark"
  | "comment"
  | "chat"
  | "keyword"
  | "system"
  | "trade";

export type StoredNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  targetType: string | null;
  targetId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicNotification = Omit<StoredNotification, "userId">;
