import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { getMarketPostList, removeUserMarketPostBookmarks } from "@/lib/marketplace-store";
import { syncUserBookmarksMarkdown } from "@/lib/user-bookmark-store";

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawIds = Array.isArray(body.ids) ? body.ids as unknown[] : [];
    const ids = rawIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0);

    if (!ids.length) {
      return NextResponse.json({ error: "삭제할 북마크를 선택해 주세요." }, { status: 400 });
    }

    const deletedIds = await removeUserMarketPostBookmarks(user.id, ids);
    const posts = (await getMarketPostList(user.id)).filter((post) => post.isBookmarked);

    await syncUserBookmarksMarkdown(user.id, posts);

    return NextResponse.json({ deletedIds, posts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "북마크를 삭제하지 못했습니다." },
      { status: 400 },
    );
  }
}
