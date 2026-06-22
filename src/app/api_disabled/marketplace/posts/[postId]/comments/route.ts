import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { addMarketPostComment } from "@/lib/marketplace-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { postId } = await params;
    const body = await request.json();
    const post = await addMarketPostComment(postId, user, {
      content: body.content,
      parentId: body.parentId,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "댓글을 저장하지 못했습니다." },
      { status: 400 },
    );
  }
}
