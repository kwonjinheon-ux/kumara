"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function NotificationsPage() {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return <main className="notifications-shell">Loading...</main>;
  }

  if (!firebaseUser) {
    return (
      <main className="notifications-shell">
        <p className="form-error">로그인이 필요합니다.</p>
      </main>
    );
  }

  return (
    <main className="notifications-shell">
      <section className="notification-center">
        <h1>알림</h1>
        <p>Firebase 알림 컬렉션 연동 준비 중입니다.</p>
      </section>
    </main>
  );
}
