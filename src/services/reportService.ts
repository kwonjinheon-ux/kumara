import { reportRepository } from "@/repositories/reportRepository";

// Report service enforces report defaults before storing moderation records.
export const reportService = {
  createReport: reportRepository.create,
  updateReportStatus: reportRepository.updateStatus,
};
