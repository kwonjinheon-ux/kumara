import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { bumpMarketPost, toMarketPostActionResult } from "@/lib/marketplace-store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { postId } = await params;
    const post = await bumpMarketPost(postId, user);

    return NextResponse.json({ post: toMarketPostActionResult(post) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "끌어올리기를 실행하지 못했습니다." },
      { status: 400 },
    );
  }
}
