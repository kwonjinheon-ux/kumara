import { redirect } from "next/navigation";

import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { getCurrentUser } from "@/lib/current-user";
import { getUserNotifications } from "@/lib/notification-store";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const notifications = await getUserNotifications(user.id);

  return (
    <main className="notifications-shell">
      <NotificationCenter initialNotifications={notifications} />
    </main>
  );
}
