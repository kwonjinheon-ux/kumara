// Notification model separates user-facing alerts from rendering components.
export type NotificationStatus = "unread" | "read" | "archived";
export type NotificationType = "comment" | "like" | "trade" | "report" | "system";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string | null;
  status: NotificationStatus;
  createdAt: string;
  readAt: string | null;
};
