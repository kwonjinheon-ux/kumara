import { NextResponse } from "next/server";

import { leaveChat } from "@/lib/chat-store";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{
    chatId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { chatId } = await context.params;
  const chats = await leaveChat(chatId, user.id);

  if (!chats) {
    return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ chats });
}
