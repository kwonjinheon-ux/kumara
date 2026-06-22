import { addDoc, collection, serverTimestamp, updateDoc, doc } from "firebase/firestore";

import { getFirestoreDb } from "@/app/firebase";
import type { Report } from "@/models/Report";

// Report repository writes moderation reports to Firestore.
export const reportRepository = {
  async create(values: Omit<Report, "id" | "createdAt" | "updatedAt">) {
    return addDoc(collection(getFirestoreDb(), "reports"), {
      ...values,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async updateStatus(reportId: string, status: Report["status"], assignedAdminId: string | null) {
    await updateDoc(doc(getFirestoreDb(), "reports", reportId), {
      assignedAdminId,
      status,
      updatedAt: serverTimestamp(),
    });
  },
};
