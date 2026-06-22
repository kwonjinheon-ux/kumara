import { NextResponse } from "next/server";

import { addChatMessageToRoom, markChatReadRoom } from "@/lib/chat-store";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{
    chatId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { chatId } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  try {
    const chat = await addChatMessageToRoom(chatId, user.id, String(body.message ?? ""));

    if (!chat) {
      return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "메시지를 보낼 수 없습니다." },
      { status: 400 },
    );
  }
}

export async function PATCH(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { chatId } = await context.params;
  const chat = await markChatReadRoom(chatId, user.id);

  if (!chat) {
    return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ chat });
}
