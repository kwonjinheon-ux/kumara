import { findUserById } from "@/lib/user-store";
import { getSessionUserId } from "@/lib/session";

export async function getCurrentUser() {
  const userId = await getSessionUserId();

  if (!userId) return null;
  return findUserById(userId);
}
