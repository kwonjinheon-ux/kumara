import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { createMarketPost, getMarketPostList } from "@/lib/marketplace-store";

export async function GET() {
  const user = await getCurrentUser();
  const posts = await getMarketPostList(user?.id);

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const post = await createMarketPost(user, body);

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "게시글을 저장하지 못했습니다." },
      { status: 400 },
    );
  }
}
