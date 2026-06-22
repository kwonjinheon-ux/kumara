import { isHamiltonRegion } from "@/config/marketplace";
import { compareMarketPostPopularity, getWeeklyPopularMarketPosts } from "@/lib/marketplace-popular";
import type {
  MarketplaceBoardViewModelInput,
  MarketplaceMenu,
} from "@/features/marketplace/model/marketplace.model";
import type { PublicMarketPost } from "@/types/marketplace";

export function selectVisibleMarketPosts({
  filters,
  now,
  posts,
}: MarketplaceBoardViewModelInput) {
  const normalizedQuery = filters.activeQuery.trim().toLowerCase();
  const normalizedSeller = filters.initialSeller.trim().toLowerCase();
  const weeklyPopularIds =
    filters.activeMenu === "인기글"
      ? new Set(getWeeklyPopularMarketPosts(posts, { now }).map((post) => post.id))
      : null;

  const filteredPosts = posts.filter((post) => {
    const matchesMenu =
      filters.activeMenu === "인기글"
        ? weeklyPopularIds?.has(post.id)
        : filters.activeMenu === "북마크"
          ? post.isBookmarked
          : filters.activeMenu === "내 판매글"
            ? post.isOwner
            : post.boardType === filters.activeMenu;
    const matchesQuery = normalizedQuery
      ? `${post.title} ${post.content} ${post.authorNickname} ${post.region} ${post.itemCategory} ${post.tradeMethod} ${post.itemCondition}`
          .toLowerCase()
          .includes(normalizedQuery)
      : true;
    const matchesSeller = normalizedSeller
      ? [post.userId, post.authorNickname].some((value) => value?.toLowerCase() === normalizedSeller)
      : true;
    const matchesRegion =
      filters.region === "전체" ||
      post.region === filters.region ||
      (filters.region === "Hamilton" &&
        isHamiltonRegion(post.region) &&
        (filters.hamiltonSuburb === "전체" || post.region === filters.hamiltonSuburb));
    const matchesCategory = filters.itemCategory === "전체" || post.itemCategory === filters.itemCategory;
    const matchesStatus = filters.status === "전체" || post.status === filters.status;

    return matchesMenu && matchesQuery && matchesSeller && matchesRegion && matchesCategory && matchesStatus;
  });

  return sortMarketPosts(filteredPosts, filters.sort);
}

export function selectMarketplaceRailPosts(posts: PublicMarketPost[], now: number) {
  return getWeeklyPopularMarketPosts(posts, { now });
}

export function normalizeMarketMenu(value: string): MarketplaceMenu {
  const normalized = value.trim().toLowerCase();

  if (["bookmark", "bookmarks", "saved", "북마크"].includes(normalized)) return "북마크";
  if (["popular", "인기글"].includes(normalized)) return "인기글";
  if (["my", "mine", "my-posts", "내 판매글"].includes(normalized)) return "내 판매글";
  if (["sell", "sale", "personal-sale", "personal_sell", "개인판매"].includes(normalized)) return "개인판매";
  if (["buy", "wanted", "개인구매"].includes(normalized)) return "개인구매";
  if (["free", "무료나눔"].includes(normalized)) return "무료나눔";
  if (["business", "업체판매"].includes(normalized)) return "업체판매";
  if (["group", "공동구매"].includes(normalized)) return "공동구매";

  return "개인판매";
}

export function getMarketMenuSlug(menu: string) {
  if (menu === "북마크") return "bookmarks";
  if (menu === "인기글") return "popular";
  if (menu === "내 판매글") return "my-posts";
  if (menu === "개인구매") return "buy";
  if (menu === "무료나눔") return "free";
  if (menu === "업체판매") return "business";
  if (menu === "공동구매") return "group";
  return "sell";
}

function sortMarketPosts(posts: PublicMarketPost[], sort: string) {
  return [...posts].sort((a, b) => {
    if (sort === "인기순") {
      return compareMarketPostPopularity(a, b);
    }

    if (sort === "가격 낮은순") {
      return getComparablePrice(a) - getComparablePrice(b);
    }

    if (sort === "가격 높은순") {
      return getComparablePrice(b) - getComparablePrice(a);
    }

    if (sort === "댓글 많은순") {
      return b.commentCount - a.commentCount;
    }

    if (sort === "조회수순") {
      return b.viewCount - a.viewCount;
    }

    return getSortDate(b).localeCompare(getSortDate(a));
  });
}

function getComparablePrice(post: PublicMarketPost) {
  if (post.priceType !== "amount") return Number.POSITIVE_INFINITY;
  return post.priceAmount ?? 0;
}

function getSortDate(post: PublicMarketPost) {
  return post.bumpedAt ?? post.createdAt;
}
