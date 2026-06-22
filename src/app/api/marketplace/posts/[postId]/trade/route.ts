import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import {
  confirmMarketPurchaseByBuyer,
  confirmMarketPurchaseBySeller,
  requestMarketPurchase,
  selectMarketPurchaseBuyer,
  toMarketPostActionResult,
} from "@/lib/marketplace-store";

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
    const body = await request.json().catch(() => ({})) as { action?: string; buyerId?: unknown };
    const post = await runTradeAction(postId, user, body);

    return NextResponse.json({ post: toMarketPostActionResult(post) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "거래 요청을 처리하지 못했습니다." },
      { status: 400 },
    );
  }
}

async function runTradeAction(
  postId: string,
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  body: { action?: string; buyerId?: unknown },
) {
  if (body.action === "request_purchase") {
    return requestMarketPurchase(postId, user);
  }

  if (body.action === "select_buyer") {
    return selectMarketPurchaseBuyer(postId, user, body.buyerId);
  }

  if (body.action === "buyer_confirm") {
    return confirmMarketPurchaseByBuyer(postId, user);
  }

  if (body.action === "seller_confirm") {
    return confirmMarketPurchaseBySeller(postId, user);
  }

  throw new Error("알 수 없는 거래 요청입니다.");
}
