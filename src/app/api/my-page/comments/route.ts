import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { deleteUserMarketplaceComments, getUserMarketplaceComments } from "@/lib/marketplace-store";
import { deleteStoredUserComments, getStoredUserComments, syncUserCommentsMarkdown } from "@/lib/user-comment-store";

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawIds = Array.isArray(body.ids) ? body.ids as unknown[] : [];
    const ids = rawIds
      ? rawIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];

    if (!ids.length) {
      return NextResponse.json({ error: "삭제할 댓글을 선택해 주세요." }, { status: 400 });
    }

    const [marketplaceDeletedIds, storedDeletedIds] = await Promise.all([
      deleteUserMarketplaceComments(user.id, ids),
      deleteStoredUserComments(user.id, ids),
    ]);
    const [marketplaceComments, storedComments] = await Promise.all([
      getUserMarketplaceComments(user.id),
      getStoredUserComments(user.id),
    ]);
    const comments = [...marketplaceComments, ...storedComments]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    await syncUserCommentsMarkdown(comments);

    return NextResponse.json({
      deletedIds: [...marketplaceDeletedIds, ...storedDeletedIds],
      comments,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "댓글을 삭제하지 못했습니다." },
      { status: 400 },
    );
  }
}
