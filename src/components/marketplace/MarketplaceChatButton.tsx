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

  function startChat() {
    if (!isLoggedIn) {
      window.location.assign("/auth/login");
      return;
    }

    setMessage("Firebase 채팅 기능을 연결하는 중입니다. 지금은 마이페이지 채팅 탭으로 이동합니다.");
    window.location.assign(
      `/my-page?tab=chat&postId=${encodeURIComponent(postId)}&title=${encodeURIComponent(postTitle)}&seller=${encodeURIComponent(authorNickname)}`,
    );
  }

  return (
    <div className="market-detail-chat-action">
      <Button className="market-detail-chat-button" fullWidth onClick={startChat} type="button">
        1:1 채팅 시작
      </Button>
      {message ? <span>{message}</span> : null}
    </div>
  );
}
