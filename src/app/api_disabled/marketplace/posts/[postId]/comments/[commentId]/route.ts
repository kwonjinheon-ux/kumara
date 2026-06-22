import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { deleteMarketPostComment, updateMarketPostComment } from "@/lib/marketplace-store";

type Context = {
  params: Promise<{
    commentId: string;
    postId: string;
  }>;
};

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { commentId, postId } = await params;
    const body = (await request.json().catch(() => ({}))) as { content?: unknown };
    const content = typeof body.content === "string" ? body.content : "";
    const post = await updateMarketPostComment(postId, commentId, user, content);

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "댓글을 수정하지 못했습니다." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { commentId, postId } = await params;
    const post = await deleteMarketPostComment(postId, commentId, user);

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "댓글을 삭제하지 못했습니다." },
      { status: 400 },
    );
  }
}
