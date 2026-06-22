"use client";

import { useState } from "react";

import { Button } from "@/components/common/Button";

type Props = {
  authorNickname: string;
  isLoggedIn: boolean;
  postId: string;
  postTitle: string;
};

export function MarketplaceChatButton({ authorNickname, isLoggedIn, postId, postTitle }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function startChat() {
    if (!isLoggedIn) {
      window.location.assign("/auth/login");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const response = await fetch("/api/my-page/chats", {
      body: JSON.stringify({
        recipient: authorNickname,
        postId,
        postTitle,
        message: `${postTitle} 글 보고 연락드립니다.`,
      }),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = await response.json().catch(() => null) as { chats?: Array<{ id: string }>; error?: string } | null;

    setSubmitting(false);

    if (!response.ok) {
      setMessage(result?.error ?? "채팅방을 만들 수 없습니다.");
      return;
    }

    const chatId = result?.chats?.[0]?.id;
    window.location.assign(chatId ? `/my-page?tab=chat&chatId=${encodeURIComponent(chatId)}` : "/my-page?tab=chat");
  }

  return (
    <div className="market-detail-chat-action">
      <Button className="market-detail-chat-button" disabled={submitting} fullWidth onClick={startChat} type="button">
        {submitting ? "채팅방 준비 중" : "1:1 채팅시작"}
      </Button>
      {message ? <span>{message}</span> : null}
    </div>
  );
}
