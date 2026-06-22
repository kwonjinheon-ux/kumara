import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { voteMarketPostComment } from "@/lib/marketplace-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { postId, commentId } = await params;
    const body = await request.json();
    const post = await voteMarketPostComment(postId, commentId, user, body.vote);

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "댓글 추천을 변경하지 못했습니다." },
      { status: 400 },
    );
  }
}
