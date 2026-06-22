import type { PublicMarketPost } from "@/types/marketplace";

export type MarketplaceMenu =
  | "개인판매"
  | "개인구매"
  | "무료나눔"
  | "업체판매"
  | "공동구매"
  | "북마크"
  | "내 판매글"
  | "인기글";

export type MarketplaceFilterState = {
  activeMenu: MarketplaceMenu;
  activeQuery: string;
  hamiltonSuburb: string;
  initialSeller: string;
  itemCategory: string;
  region: string;
  sort: string;
  status: string;
};

export type MarketplaceBoardViewModelInput = {
  filters: MarketplaceFilterState;
  now: number;
  posts: PublicMarketPost[];
};

export type MarketplaceBoardViewModel = {
  allVisibleSelected: boolean;
  isBookmarkMenu: boolean;
  isDeletingManagedItems: boolean;
  isManageMenu: boolean;
  isSellManageMenu: boolean;
  railPosts: PublicMarketPost[];
  visiblePosts: PublicMarketPost[];
};
