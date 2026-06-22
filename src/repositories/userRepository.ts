import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { getFirestoreDb } from "@/app/firebase";
import type { User } from "@/models/User";

// User repository centralizes role/profile reads for role-based admin expansion.
export const userRepository = {
  async findById(userId: string) {
    const snapshot = await getDoc(doc(getFirestoreDb(), "users", userId));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as User) : null;
  },

  async upsertProfile(user: User) {
    await setDoc(doc(getFirestoreDb(), "users", user.id), user, { merge: true });
  },

  async updateRole(userId: string, role: User["role"]) {
    await updateDoc(doc(getFirestoreDb(), "users", userId), { role });
  },
};
