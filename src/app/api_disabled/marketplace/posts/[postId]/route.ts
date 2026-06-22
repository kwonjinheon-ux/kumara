import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { deleteMarketPost, updateMarketPost } from "@/lib/marketplace-store";

export async function PATCH(
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
    const post = await updateMarketPost(postId, user, body);

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "게시글을 수정하지 못했습니다." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { postId } = await params;
    await deleteMarketPost(postId, user);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "게시글을 삭제하지 못했습니다." },
      { status: 400 },
    );
  }
}
