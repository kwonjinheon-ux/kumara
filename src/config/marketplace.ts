import type {
  MarketBoardType,
  MarketItemCategory,
  MarketItemCondition,
  MarketStatus,
  MarketTradeMethod,
} from "@/types/marketplace";
import type { MembershipLevel } from "@/config/membershipLevels";

export const marketBoardTypes: MarketBoardType[] = [
  "개인판매",
  "개인구매",
  "무료나눔",
  "업체판매",
  "공동구매",
];

export const marketItemCategories: MarketItemCategory[] = [
  "가전제품",
  "가구 / 인테리어",
  "생활용품",
  "주방용품",
  "유아 / 아동용품",
  "의류 / 패션",
  "뷰티 / 건강",
  "취미 / 스포츠",
  "전자기기",
  "책 / 문구",
  "자동차용품",
  "반려동물용품",
  "티켓 / 상품권",
  "기타",
];

export const marketRegions = [
  "Auckland",
  "Hamilton",
  "Wellington",
  "Christchurch",
  "Tauranga",
  "Dunedin",
  "기타",
];

export const hamiltonSuburbs = [
  "Flagstaff",
  "Rototuna",
  "Rototuna North",
  "Huntington",
  "Queenwood",
  "Chartwell",
  "Chedworth",
  "Pukete",
  "St Andrews",
  "Te Rapa",
  "Hamilton East",
  "Hillcrest",
  "Silverdale",
  "Riverlea",
  "Ruakura",
  "Claudelands",
  "Fairfield",
  "Fairview Downs",
  "Enderley",
  "Dinsdale",
  "Nawton",
  "Frankton",
  "Forest Lake",
  "Beerescourt",
  "Maeroa",
  "Western Heights",
  "Whitiora",
  "Crawshaw",
  "Glenview",
  "Melville",
  "Bader",
  "Deanwell",
  "Fitzroy",
  "Peacocke",
  "Temple View",
  "Hamilton Central / CBD",
  "Hamilton Lake",
  "Hamilton West",
  "Hamilton North",
  "Cambridge",
  "Te Awamutu",
  "Ngaruawahia",
  "Tamahere",
  "Matangi",
  "Gordonton",
  "Huntly",
  "Raglan",
];

export const hamiltonRegions = ["Hamilton", ...hamiltonSuburbs];

export function isHamiltonRegion(region: string) {
  return hamiltonRegions.includes(region);
}

export const marketStatuses: MarketStatus[] = ["판매중", "거래중", "거래완료 대기", "판매완료"];

export const marketTradeMethods: MarketTradeMethod[] = [
  "직거래",
  "택배",
  "직거래/택배",
  "픽업만",
  "협의",
];

export const marketItemConditions: MarketItemCondition[] = [
  "새거",
  "민트",
  "상태 좋음",
  "사용감 있음",
  "완전중고",
  "수리 필요",
];

export const marketSortOptions = [
  "최신순",
  "인기순",
  "가격 낮은순",
  "가격 높은순",
  "댓글 많은순",
  "조회수순",
];

export const marketplaceImageLimitByLevel: Record<MembershipLevel, number> = {
  iron: 4,
  silver: 6,
  gold: 8,
  platinum: 10,
  diamond: 12,
  master: 15,
  master_plus: 20,
};

export function getMarketplaceImageLimit(level: MembershipLevel) {
  return marketplaceImageLimitByLevel[level] ?? marketplaceImageLimitByLevel.iron;
}
