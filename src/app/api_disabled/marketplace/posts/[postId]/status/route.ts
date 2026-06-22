import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { toMarketPostActionResult, updateMarketPostStatus } from "@/lib/marketplace-store";

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
    const post = await updateMarketPostStatus(postId, user, body.status);

    return NextResponse.json({ post: toMarketPostActionResult(post) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "상태를 변경하지 못했습니다." },
      { status: 400 },
    );
  }
}
