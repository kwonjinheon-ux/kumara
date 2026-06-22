import { NextResponse } from "next/server";

import { createOrGetChat, getUserChats } from "@/lib/chat-store";
import { getCurrentUser } from "@/lib/current-user";
import { findUserByEmailOrNickname } from "@/lib/user-store";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  return NextResponse.json({ chats: await getUserChats(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const recipientQuery = String(body.recipient ?? "").trim();

  if (!recipientQuery) {
    return NextResponse.json({ error: "상대방 이메일 또는 닉네임을 입력해 주세요." }, { status: 400 });
  }

  const recipient = await findUserByEmailOrNickname(recipientQuery);

  if (!recipient) {
    return NextResponse.json({ error: "해당 사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const chats = await createOrGetChat({
      currentUser: user,
      recipient,
      postId: optionalText(body.postId, 80),
      postTitle: optionalText(body.postTitle, 80),
      initialMessage: optionalText(body.message, 500),
    });

    return NextResponse.json({ chats });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "채팅방을 만들 수 없습니다." },
      { status: 400 },
    );
  }
}

function optionalText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : null;
}
