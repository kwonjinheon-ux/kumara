"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/common/Button";
import type { PublicNotification } from "@/types/notification";

type NotificationCenterProps = {
  initialNotifications: PublicNotification[];
};

const typeLabels: Record<PublicNotification["type"], string> = {
  bookmark: "북마크",
  comment: "댓글",
  chat: "채팅",
  keyword: "키워드",
  system: "시스템",
  trade: "거래",
};

function getNotificationHref(notification: PublicNotification) {
  if (!notification.targetId) return null;

  if (notification.targetType === "marketplace" || notification.targetType === "post") {
    return `/marketplace/${notification.targetId}`;
  }

  if (notification.targetType === "chat") {
    return `/my-page?tab=chat&chatId=${notification.targetId}`;
  }

  return null;
}

export function NotificationCenter({ initialNotifications }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [editingId, setEditingId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [notice, setNotice] = useState("");
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  function startEdit(notification: PublicNotification) {
    setEditingId(notification.id);
    setEditTitle(notification.title);
    setEditMessage(notification.message);
    setNotice("");
  }

  async function updateOne(notificationId: string, body: Record<string, unknown>, message: string) {
    setNotice("");
    const response = await fetch(`/api/notifications/${notificationId}`, {
      body: JSON.stringify(body),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = await response.json().catch(() => null) as {
      error?: string;
      notifications?: PublicNotification[];
    } | null;

    if (!response.ok || !result?.notifications) {
      setNotice(result?.error ?? "알림을 수정할 수 없습니다.");
      return;
    }

    setNotifications(result.notifications);
    setEditingId("");
    setNotice(message);
  }

  async function deleteOne(notificationId: string) {
    setNotice("");
    const response = await fetch(`/api/notifications/${notificationId}`, {
      credentials: "same-origin",
      method: "DELETE",
    });
    const result = await response.json().catch(() => null) as {
      error?: string;
      notifications?: PublicNotification[];
    } | null;

    if (!response.ok || !result?.notifications) {
      setNotice(result?.error ?? "알림을 삭제할 수 없습니다.");
      return;
    }

    setNotifications(result.notifications);
    setNotice("알림을 삭제했습니다.");
  }

  async function markAllRead() {
    setNotice("");
    const response = await fetch("/api/notifications", {
      body: JSON.stringify({ action: "markAllRead" }),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = await response.json().catch(() => null) as {
      error?: string;
      notifications?: PublicNotification[];
    } | null;

    if (!response.ok || !result?.notifications) {
      setNotice(result?.error ?? "알림을 읽음 처리할 수 없습니다.");
      return;
    }

    setNotifications(result.notifications);
    setNotice("모든 알림을 확인 처리했습니다.");
  }

  async function deleteAll() {
    setNotice("");
    const response = await fetch("/api/notifications", {
      credentials: "same-origin",
      method: "DELETE",
    });
    const result = await response.json().catch(() => null) as {
      error?: string;
      notifications?: PublicNotification[];
    } | null;

    if (!response.ok || !result?.notifications) {
      setNotice(result?.error ?? "전체 삭제에 실패했습니다.");
      return;
    }

    setNotifications(result.notifications);
    setNotice("모든 알림을 삭제했습니다.");
  }

  return (
    <section className="notification-page">
      <div className="notification-hero">
        <div>
          <p className="eyebrow">Notifications</p>
          <h1>알림</h1>
          <p>북마크, 댓글, 채팅, 키워드 알림을 한눈에 확인하고 관리합니다.</p>
        </div>
        <div className="notification-count-card">
          <span>읽지 않은 알림</span>
          <strong>{unreadCount}</strong>
        </div>
      </div>

      <div className="notification-toolbar">
        <Button onClick={markAllRead} type="button" variant="muted">전체 읽음</Button>
        <Button onClick={deleteAll} type="button" variant="muted">전체 삭제</Button>
      </div>

      {notice ? <p className={notice.includes("실패") || notice.includes("없습니다") ? "form-error" : "form-success"}>{notice}</p> : null}

      <div className="notification-list">
        {notifications.length ? (
          notifications.map((notification) => {
            const targetHref = getNotificationHref(notification);

            return (
              <article className={notification.isRead ? "notification-item read" : "notification-item"} key={notification.id}>
                <div className="notification-type">{typeLabels[notification.type]}</div>
                {editingId === notification.id ? (
                  <div className="notification-edit">
                    <input
                      onChange={(event) => setEditTitle(event.target.value)}
                      value={editTitle}
                    />
                    <textarea
                      onChange={(event) => setEditMessage(event.target.value)}
                      rows={3}
                      value={editMessage}
                    />
                    <div className="notification-actions">
                      <Button
                        onClick={() => updateOne(notification.id, { title: editTitle, message: editMessage }, "알림을 수정했습니다.")}
                        type="button"
                      >
                        저장
                      </Button>
                      <Button onClick={() => setEditingId("")} type="button" variant="muted">취소</Button>
                    </div>
                  </div>
                ) : (
                  <div className="notification-content">
                    <div>
                      <strong>{notification.title}</strong>
                      <span>{formatDate(notification.createdAt)}</span>
                    </div>
                    <p>{notification.message}</p>
                    {targetHref ? (
                      <Link className="notification-target-link" href={targetHref}>
                        바로 확인
                      </Link>
                    ) : null}
                    {notification.isRead && notification.readAt ? (
                      <small>확인됨 · 7일 뒤 자동 정리</small>
                    ) : null}
                  </div>
                )}
                <div className="notification-actions">
                  <Button
                    onClick={() => updateOne(notification.id, { isRead: !notification.isRead }, notification.isRead ? "읽지 않음으로 바꿨습니다." : "알림을 확인했습니다.")}
                    type="button"
                    variant="muted"
                  >
                    {notification.isRead ? "읽지 않음" : "확인"}
                  </Button>
                  <Button onClick={() => startEdit(notification)} type="button" variant="muted">수정</Button>
                  <Button onClick={() => deleteOne(notification.id)} type="button" variant="muted">삭제</Button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="notification-empty">현재 도착한 알림이 없습니다.</div>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hours < 12 ? "오전" : "오후";
  const displayHours = String(hours % 12 || 12).padStart(2, "0");

  return `${month}월 ${day}일 ${meridiem} ${displayHours}:${minutes}`;
}
