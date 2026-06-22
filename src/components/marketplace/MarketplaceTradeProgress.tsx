"use client";

import { useState } from "react";

import { useLanguage } from "@/hooks/useLanguage";
import { translate, translateMarketValue } from "@/lib/i18n";
import type { MarketPurchaseRequest, PublicMarketPost } from "@/types/marketplace";

type Props = {
  initialPost: PublicMarketPost;
  isLoggedIn: boolean;
};

type TradePatch = Partial<
  Pick<
    PublicMarketPost,
    | "myPurchaseRequest"
    | "pointAwardedAt"
    | "purchaseRequests"
    | "selectedBuyerId"
    | "selectedPurchaseRequest"
    | "status"
    | "updatedAt"
  >
>;

export function MarketplaceTradeProgress({ initialPost, isLoggedIn }: Props) {
  const { language } = useLanguage();
  const [post, setPost] = useState(initialPost);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const progress = getTradeProgressSummary(post, language);
  const isSold = post.status === "판매완료";

  async function runTradeAction(action: string, body: Record<string, unknown> = {}) {
    if (!isLoggedIn) {
      window.location.assign("/auth/login");
      return;
    }

    if (pendingAction) return;

    const previousPost = post;
    setPendingAction(action);
    setMessage(getTradeActionMessage(action, language));
    setPost((current) => getOptimisticPost(current, action, body));

    try {
      const response = await fetch(`/api/marketplace/posts/${post.id}/trade`, {
        body: JSON.stringify({ action, ...body }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.error ?? "거래 요청을 처리하지 못했습니다.");
        setPost(previousPost);
        return;
      }

      setPost((current) => ({ ...current, ...(result.post as TradePatch) }));
      setMessage(getTradeActionMessage(action, language));
    } catch {
      setMessage("거래 요청을 처리하지 못했습니다.");
      setPost(previousPost);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className={`market-detail-quick-info__item market-detail-trade-progress-card ${progress.tone}`}>
      <span>{translate(language, "market.tradeProgress")}</span>
      <strong>{progress.label}</strong>
      <small>{message ?? progress.detail}</small>
      {post.isOwner ? (
        <OwnerTradeControls
          isSold={isSold}
          onSelectBuyer={(buyerId) => runTradeAction("select_buyer", { buyerId })}
          onSellerConfirm={() => runTradeAction("seller_confirm")}
          language={language}
          pendingAction={pendingAction}
          post={post}
        />
      ) : (
        <BuyerTradeControls
          isSold={isSold}
          myRequest={post.myPurchaseRequest}
          onBuyerConfirm={() => runTradeAction("buyer_confirm")}
          onRequest={() => runTradeAction("request_purchase")}
          language={language}
          pendingAction={pendingAction}
          selectedRequest={post.selectedPurchaseRequest}
        />
      )}
    </div>
  );
}

function OwnerTradeControls({
  isSold,
  language,
  onSelectBuyer,
  onSellerConfirm,
  pendingAction,
  post,
}: {
  isSold: boolean;
  language: ReturnType<typeof useLanguage>["language"];
  onSelectBuyer: (buyerId: string) => void;
  onSellerConfirm: () => void;
  pendingAction: string | null;
  post: PublicMarketPost;
}) {
  const requests = post.purchaseRequests ?? [];
  const selectedRequest = post.selectedPurchaseRequest;

  if (isSold) return null;

  if (selectedRequest?.status === "buyer_confirmed") {
    return (
      <button
        className="market-trade-progress-action primary"
        disabled={Boolean(pendingAction)}
        onClick={onSellerConfirm}
        type="button"
      >
        {getTradeUiText(language, "sellerConfirm")}
      </button>
    );
  }

  if (requests.length && !selectedRequest) {
    return (
      <div className="market-trade-progress-request-list">
        {requests.map((request) => (
          <button
            disabled={Boolean(pendingAction)}
            key={request.id}
            onClick={() => onSelectBuyer(request.buyerId)}
            type="button"
          >
            {getTradeUiText(language, "selectBuyer", { buyer: request.buyerNickname })}
          </button>
        ))}
      </div>
    );
  }

  return null;
}

function BuyerTradeControls({
  isSold,
  language,
  myRequest,
  onBuyerConfirm,
  onRequest,
  pendingAction,
  selectedRequest,
}: {
  isSold: boolean;
  language: ReturnType<typeof useLanguage>["language"];
  myRequest: MarketPurchaseRequest | null;
  onBuyerConfirm: () => void;
  onRequest: () => void;
  pendingAction: string | null;
  selectedRequest: MarketPurchaseRequest | null;
}) {
  if (isSold) return null;

  const isSelectedBuyer = Boolean(myRequest && selectedRequest?.buyerId === myRequest.buyerId);

  if (!myRequest) {
    return (
      <button
        className="market-trade-progress-action primary"
        disabled={Boolean(pendingAction)}
        onClick={onRequest}
        type="button"
      >
        {getTradeUiText(language, "requestPurchase")}
      </button>
    );
  }

  if (isSelectedBuyer && myRequest.status === "selected") {
    return (
      <button
        className="market-trade-progress-action primary"
        disabled={Boolean(pendingAction)}
        onClick={onBuyerConfirm}
        type="button"
      >
        {getTradeUiText(language, "buyerConfirm")}
      </button>
    );
  }

  return null;
}

function getOptimisticPost(post: PublicMarketPost, action: string, body: Record<string, unknown>): PublicMarketPost {
  const now = new Date().toISOString();

  if (action === "request_purchase") {
    const request: MarketPurchaseRequest = {
      id: `pending-${now}`,
      buyerId: "__me__",
      buyerNickname: "나",
      buyerConfirmedAt: null,
      requestedAt: now,
      selectedAt: null,
      sellerConfirmedAt: null,
      status: "requested",
    };

    return {
      ...post,
      myPurchaseRequest: request,
      purchaseRequests: post.isOwner ? post.purchaseRequests : [...post.purchaseRequests, request],
      updatedAt: now,
    };
  }

  if (action === "select_buyer") {
    const buyerId = String(body.buyerId ?? "");
    const selectedRequest = post.purchaseRequests.find((request) => request.buyerId === buyerId);
    if (!selectedRequest) return post;

    const nextSelected: MarketPurchaseRequest = {
      ...selectedRequest,
      buyerConfirmedAt: null,
      selectedAt: now,
      sellerConfirmedAt: null,
      status: "selected",
    };

    return {
      ...post,
      purchaseRequests: post.purchaseRequests.map((request) =>
        request.buyerId === buyerId ? nextSelected : { ...request, buyerConfirmedAt: null, selectedAt: null, status: "requested" },
      ),
      selectedBuyerId: buyerId,
      selectedPurchaseRequest: nextSelected,
      status: "거래완료 대기",
      updatedAt: now,
    };
  }

  if (action === "buyer_confirm") {
    const nextSelected = post.selectedPurchaseRequest
      ? { ...post.selectedPurchaseRequest, buyerConfirmedAt: now, status: "buyer_confirmed" as const }
      : null;

    return {
      ...post,
      myPurchaseRequest: post.myPurchaseRequest
        ? { ...post.myPurchaseRequest, buyerConfirmedAt: now, status: "buyer_confirmed" }
        : post.myPurchaseRequest,
      purchaseRequests: post.purchaseRequests.map((request) =>
        request.buyerId === post.selectedBuyerId ? { ...request, buyerConfirmedAt: now, status: "buyer_confirmed" } : request,
      ),
      selectedPurchaseRequest: nextSelected,
      updatedAt: now,
    };
  }

  if (action === "seller_confirm") {
    const nextSelected = post.selectedPurchaseRequest
      ? { ...post.selectedPurchaseRequest, sellerConfirmedAt: now, status: "seller_confirmed" as const }
      : null;

    return {
      ...post,
      pointAwardedAt: now,
      purchaseRequests: post.purchaseRequests.map((request) =>
        request.buyerId === post.selectedBuyerId ? { ...request, sellerConfirmedAt: now, status: "seller_confirmed" } : request,
      ),
      selectedPurchaseRequest: nextSelected,
      status: "판매완료",
      updatedAt: now,
    };
  }

  return post;
}

function getTradeProgressSummary(post: PublicMarketPost, language: ReturnType<typeof useLanguage>["language"]) {
  if (post.status === "판매완료") {
    return {
      detail: getTradeUiText(language, post.pointAwardedAt ? "pointsRecorded" : "tradeClosed"),
      label: translateMarketValue(language, "판매완료"),
      tone: "is-done",
    };
  }

  const selected = post.selectedPurchaseRequest;
  if (selected?.status === "buyer_confirmed") {
    return {
      detail: getTradeUiText(language, "buyerConfirmed", { buyer: selected.buyerNickname }),
      label: getTradeUiText(language, "sellerConfirmNeeded"),
      tone: "is-action",
    };
  }

  if (selected) {
    return {
      detail: getTradeUiText(language, "waitingBuyer", { buyer: selected.buyerNickname }),
      label: translateMarketValue(language, "거래완료 대기"),
      tone: "is-pending",
    };
  }

  const requestCount = post.purchaseRequests.length;
  if (requestCount > 0) {
    return {
      detail: getTradeUiText(language, "requestCount", { count: requestCount.toLocaleString(language === "ko" ? "ko-KR" : language === "zh" ? "zh-CN" : "en-US") }),
      label: getTradeUiText(language, "selectBuyerNeeded"),
      tone: "is-action",
    };
  }

  return {
    detail: getTradeUiText(language, "waitingRequests"),
    label: translateMarketValue(language, post.status),
    tone: "is-open",
  };
}

function getTradeActionMessage(action: string, language: ReturnType<typeof useLanguage>["language"]) {
  if (action === "request_purchase") return getTradeUiText(language, "requestSent");
  if (action === "select_buyer") return getTradeUiText(language, "buyerSelected");
  if (action === "buyer_confirm") return getTradeUiText(language, "buyerConfirmSent");
  if (action === "seller_confirm") return getTradeUiText(language, "soldComplete");
  return getTradeUiText(language, "tradeHandled");
}

function getTradeUiText(
  language: ReturnType<typeof useLanguage>["language"],
  key: keyof typeof tradeUiText.ko,
  values: Record<string, string> = {},
): string {
  const template = String(tradeUiText[language][key] ?? tradeUiText.ko[key] ?? key);
  return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), template);
}

const tradeUiText = {
  ko: {
    buyerConfirm: "거래 완료 확인",
    buyerConfirmSent: "거래 완료 확인을 보냈습니다.",
    buyerConfirmed: "{buyer} 확인 완료",
    buyerSelected: "구매자를 선택했습니다.",
    pointsRecorded: "포인트 지급 기록 완료",
    requestCount: "{count}명 요청",
    requestPurchase: "구매 요청",
    requestSent: "구매 요청을 보냈습니다.",
    selectBuyer: "{buyer} 선택",
    selectBuyerNeeded: "구매자 선택 필요",
    sellerConfirm: "최종 확인",
    sellerConfirmNeeded: "판매자 최종확인 필요",
    soldComplete: "판매완료 처리되었습니다.",
    tradeClosed: "거래 종료",
    tradeHandled: "거래 요청을 처리했습니다.",
    waitingBuyer: "{buyer} 확인 대기",
    waitingRequests: "구매 요청 대기",
  },
  en: {
    buyerConfirm: "Confirm complete",
    buyerConfirmSent: "Completion confirmation sent.",
    buyerConfirmed: "{buyer} confirmed",
    buyerSelected: "Buyer selected.",
    pointsRecorded: "Points recorded",
    requestCount: "{count} requests",
    requestPurchase: "Request purchase",
    requestSent: "Purchase request sent.",
    selectBuyer: "Select {buyer}",
    selectBuyerNeeded: "Select buyer",
    sellerConfirm: "Final confirm",
    sellerConfirmNeeded: "Seller confirmation needed",
    soldComplete: "Marked as sold.",
    tradeClosed: "Trade closed",
    tradeHandled: "Trade request handled.",
    waitingBuyer: "Waiting for {buyer}",
    waitingRequests: "Waiting for requests",
  },
  zh: {
    buyerConfirm: "确认交易完成",
    buyerConfirmSent: "已发送交易完成确认。",
    buyerConfirmed: "{buyer} 已确认",
    buyerSelected: "已选择买家。",
    pointsRecorded: "积分记录已完成",
    requestCount: "{count} 个请求",
    requestPurchase: "购买请求",
    requestSent: "已发送购买请求。",
    selectBuyer: "选择 {buyer}",
    selectBuyerNeeded: "请选择买家",
    sellerConfirm: "最终确认",
    sellerConfirmNeeded: "需要卖家最终确认",
    soldComplete: "已标记为售出。",
    tradeClosed: "交易结束",
    tradeHandled: "交易请求已处理。",
    waitingBuyer: "等待 {buyer} 确认",
    waitingRequests: "等待购买请求",
  },
} as const;
