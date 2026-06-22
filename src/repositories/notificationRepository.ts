import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { getFirestoreDb } from "@/app/firebase";
import type { Notification } from "@/models/Notification";

// Notification repository owns alert reads and read-state writes.
export const notificationRepository = {
  async listUnread(userId: string) {
    const snapshot = await getDocs(
      query(collection(getFirestoreDb(), "notifications"), where("userId", "==", userId), where("status", "==", "unread"), orderBy("createdAt", "desc")),
    );
    return snapshot.docs.map((notificationDoc) => ({ id: notificationDoc.id, ...notificationDoc.data() })) as Notification[];
  },

  async markRead(notificationId: string) {
    await updateDoc(doc(getFirestoreDb(), "notifications", notificationId), {
      readAt: serverTimestamp(),
      status: "read",
    });
  },
};
