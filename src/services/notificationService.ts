import { notificationRepository } from "@/repositories/notificationRepository";

// Notification service is the business layer for read/unread alert workflows.
export const notificationService = {
  listUnread: notificationRepository.listUnread,
  markRead: notificationRepository.markRead,
};
