import { NextResponse } from "next/server";

import { deleteNotification, updateNotification } from "@/lib/notification-store";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { notificationId } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const notifications = await updateNotification(user.id, notificationId, {
    title: body.title,
    message: body.message,
    isRead: body.isRead,
  });

  if (!notifications) {
    return NextResponse.json({ error: "알림을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ notifications });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { notificationId } = await context.params;
  const notifications = await deleteNotification(user.id, notificationId);

  if (!notifications) {
    return NextResponse.json({ error: "알림을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ notifications });
}
