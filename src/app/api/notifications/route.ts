import { NextResponse } from "next/server";

import {
  deleteAllNotifications,
  getUserNotifications,
  markAllNotificationsRead,
} from "@/lib/notification-store";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  return NextResponse.json({ notifications: await getUserNotifications(user.id) });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (body?.action !== "markAllRead") {
    return NextResponse.json({ error: "알 수 없는 요청입니다." }, { status: 400 });
  }

  return NextResponse.json({ notifications: await markAllNotificationsRead(user.id) });
}

export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  return NextResponse.json({ notifications: await deleteAllNotifications(user.id) });
}
