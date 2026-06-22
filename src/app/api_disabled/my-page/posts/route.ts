import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { deleteMarketPost, getMarketPostList } from "@/lib/marketplace-store";
import { syncUserPostsMarkdown } from "@/lib/user-post-store";

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
      return NextResponse.json({ error: "삭제할 게시글을 선택해 주세요." }, { status: 400 });
    }

    for (const id of ids) {
      await deleteMarketPost(id, user);
    }

    const posts = (await getMarketPostList(user.id)).filter((post) => post.isOwner);

    await syncUserPostsMarkdown(user.id, posts);

    return NextResponse.json({ deletedIds: ids, posts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "게시글을 삭제하지 못했습니다." },
      { status: 400 },
    );
  }
}
