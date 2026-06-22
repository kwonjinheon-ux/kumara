// Report documents support user safety, moderation queues, and admin workflows.
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type ReportTargetType = "post" | "comment" | "user";

export type Report = {
  id: string;
  targetId: string;
  targetType: ReportTargetType;
  reporterId: string;
  reason: string;
  detail: string | null;
  status: ReportStatus;
  assignedAdminId: string | null;
  createdAt: string;
  updatedAt: string;
};
