export type MarketBoardType =
  | "개인판매"
  | "개인구매"
  | "무료나눔"
  | "업체판매"
  | "공동구매";

export type MarketItemCategory =
  | "가전제품"
  | "가구 / 인테리어"
  | "생활용품"
  | "주방용품"
  | "유아 / 아동용품"
  | "의류 / 패션"
  | "뷰티 / 건강"
  | "취미 / 스포츠"
  | "전자기기"
  | "책 / 문구"
  | "자동차용품"
  | "반려동물용품"
  | "티켓 / 상품권"
  | "기타";

export type MarketPriceType = "amount" | "free" | "offer";

export type MarketStatus = "판매중" | "거래중" | "거래완료 대기" | "판매완료";

export type MarketTradeMethod = "직거래" | "택배" | "직거래/택배" | "픽업만" | "협의";

export type MarketContactMethod = "email" | "kakao" | "phone" | "korin_chat";

export type MarketContactDisplay = {
  method: MarketContactMethod;
  label: string;
  value: string;
  description: string;
};

export type MarketItemCondition =
  | "새거"
  | "민트"
  | "상태 좋음"
  | "사용감 있음"
  | "완전중고"
  | "수리 필요";

export type MarketPostImage = {
  id: string;
  dataUrl: string;
  alt: string;
  thumbnailDataUrl?: string;
  createdAt: string;
};

export type MarketVoteType = "up" | "down";

export type MarketPurchaseRequestStatus =
  | "requested"
  | "selected"
  | "buyer_confirmed"
  | "seller_confirmed";

export type MarketPurchaseRequest = {
  id: string;
  buyerId: string;
  buyerNickname: string;
  status: MarketPurchaseRequestStatus;
  requestedAt: string;
  selectedAt: string | null;
  buyerConfirmedAt: string | null;
  sellerConfirmedAt: string | null;
};

export type MarketComment = {
  id: string;
  userId: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  content: string;
  parentId: string | null;
  depth: number;
  upvoteCount: number;
  downvoteCount: number;
  upvotedBy?: string[];
  downvotedBy?: string[];
  userVote?: MarketVoteType | null;
  createdAt: string;
};

export type StoredMarketPost = {
  id: string;
  userId: string | null;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  boardType: MarketBoardType;
  itemCategory: MarketItemCategory;
  title: string;
  content: string;
  contentHtml: string;
  priceType: MarketPriceType;
  priceAmount: number | null;
  region: string;
  tradeMethod: MarketTradeMethod;
  itemCondition: MarketItemCondition;
  contactMethod: MarketContactMethod;
  contactValue: string | null;
  contactMethods?: MarketContactMethod[];
  contactValues?: Partial<Record<MarketContactMethod, string | null>>;
  status: MarketStatus;
  thumbnailDataUrl: string | null;
  images: MarketPostImage[];
  coverImageId: string | null;
  viewCount: number;
  commentCount: number;
  upvoteCount: number;
  downvoteCount: number;
  bookmarkCount: number;
  bookmarkedBy: string[];
  bookmarkedAtBy: Record<string, string>;
  purchaseRequests: MarketPurchaseRequest[];
  selectedBuyerId: string | null;
  pointAwardedAt: string | null;
  upvotedBy: string[];
  downvotedBy: string[];
  comments: MarketComment[];
  isBoosted: boolean;
  bumpedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicMarketPost = StoredMarketPost & {
  isOwner: boolean;
  priceLabel: string;
  thumbLabel: string;
  coverImageUrl: string | null;
  contactDisplay: MarketContactDisplay;
  contactDisplays: MarketContactDisplay[];
  isBookmarked: boolean;
  bookmarkedAt: string | null;
  myPurchaseRequest: MarketPurchaseRequest | null;
  selectedPurchaseRequest: MarketPurchaseRequest | null;
  userVote: MarketVoteType | null;
  nextBumpAvailableAt: string | null;
};
