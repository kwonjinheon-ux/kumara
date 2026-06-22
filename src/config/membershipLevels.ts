export type MembershipLevel =
  | "iron"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "master"
  | "master_plus";

export type MembershipBenefits = {
  savedPostLimit: number | null;
  savedPostFolders: boolean;
  priceChangeAlerts: "none" | "limited" | "automatic";
  savedSearchFilters: boolean;
  quickFilters: boolean;
  scheduledBumps: "manual" | "single" | "multiple" | "repeating";
  bulkPostManagement: boolean;
  notificationLevel: "basic" | "activity" | "price_changes" | "personalized";
  profileEmphasis: "none" | "color" | "highlight" | "premium_badge";
  tradeStats: boolean;
  chatReadReceipts: boolean;
  quickReplies: boolean;
  autoReply: boolean;
  replyTemplates: boolean;
  imageReorder: boolean;
  featuredImageEmphasis: boolean;
  imageAutoEnhance: boolean;
  customThumbnail: boolean;
  adExperience: "standard" | "reduced" | "minimal" | "none";
  sellerAnalytics: boolean;
  softPostBoost: boolean;
  personalizedRecommendations: boolean;
};

export type MembershipLevelConfig = {
  level: MembershipLevel;
  label: string;
  order: number;
  principle: string;
  benefits: MembershipBenefits;
};

const conveniencePrinciple =
  "중고거래와 무료나눔으로 새 물건 소비를 줄이고, 순환소비에 꾸준히 참여한 정도를 그린 포인트로 기록합니다.";

export const membershipLevels = [
  {
    level: "iron",
    label: "씨앗",
    order: 10,
    principle: conveniencePrinciple,
    benefits: {
      savedPostLimit: 20,
      savedPostFolders: false,
      priceChangeAlerts: "none",
      savedSearchFilters: false,
      quickFilters: false,
      scheduledBumps: "manual",
      bulkPostManagement: false,
      notificationLevel: "basic",
      profileEmphasis: "none",
      tradeStats: false,
      chatReadReceipts: false,
      quickReplies: false,
      autoReply: false,
      replyTemplates: false,
      imageReorder: false,
      featuredImageEmphasis: false,
      imageAutoEnhance: false,
      customThumbnail: false,
      adExperience: "standard",
      sellerAnalytics: false,
      softPostBoost: false,
      personalizedRecommendations: false,
    },
  },
  {
    level: "silver",
    label: "새싹",
    order: 20,
    principle: conveniencePrinciple,
    benefits: {
      savedPostLimit: 40,
      savedPostFolders: false,
      priceChangeAlerts: "limited",
      savedSearchFilters: false,
      quickFilters: false,
      scheduledBumps: "manual",
      bulkPostManagement: false,
      notificationLevel: "basic",
      profileEmphasis: "none",
      tradeStats: false,
      chatReadReceipts: false,
      quickReplies: false,
      autoReply: false,
      replyTemplates: false,
      imageReorder: false,
      featuredImageEmphasis: false,
      imageAutoEnhance: false,
      customThumbnail: false,
      adExperience: "standard",
      sellerAnalytics: false,
      softPostBoost: false,
      personalizedRecommendations: false,
    },
  },
  {
    level: "gold",
    label: "잎새",
    order: 30,
    principle: conveniencePrinciple,
    benefits: {
      savedPostLimit: 70,
      savedPostFolders: true,
      priceChangeAlerts: "automatic",
      savedSearchFilters: false,
      quickFilters: false,
      scheduledBumps: "single",
      bulkPostManagement: false,
      notificationLevel: "activity",
      profileEmphasis: "color",
      tradeStats: false,
      chatReadReceipts: true,
      quickReplies: false,
      autoReply: false,
      replyTemplates: false,
      imageReorder: true,
      featuredImageEmphasis: false,
      imageAutoEnhance: false,
      customThumbnail: false,
      adExperience: "reduced",
      sellerAnalytics: false,
      softPostBoost: false,
      personalizedRecommendations: false,
    },
  },
  {
    level: "platinum",
    label: "나무",
    order: 40,
    principle: conveniencePrinciple,
    benefits: {
      savedPostLimit: 120,
      savedPostFolders: true,
      priceChangeAlerts: "automatic",
      savedSearchFilters: true,
      quickFilters: false,
      scheduledBumps: "single",
      bulkPostManagement: true,
      notificationLevel: "activity",
      profileEmphasis: "color",
      tradeStats: true,
      chatReadReceipts: true,
      quickReplies: true,
      autoReply: false,
      replyTemplates: false,
      imageReorder: true,
      featuredImageEmphasis: true,
      imageAutoEnhance: false,
      customThumbnail: false,
      adExperience: "reduced",
      sellerAnalytics: true,
      softPostBoost: false,
      personalizedRecommendations: false,
    },
  },
  {
    level: "diamond",
    label: "숲",
    order: 50,
    principle: conveniencePrinciple,
    benefits: {
      savedPostLimit: 200,
      savedPostFolders: true,
      priceChangeAlerts: "automatic",
      savedSearchFilters: true,
      quickFilters: true,
      scheduledBumps: "multiple",
      bulkPostManagement: true,
      notificationLevel: "price_changes",
      profileEmphasis: "highlight",
      tradeStats: true,
      chatReadReceipts: true,
      quickReplies: true,
      autoReply: true,
      replyTemplates: false,
      imageReorder: true,
      featuredImageEmphasis: true,
      imageAutoEnhance: true,
      customThumbnail: false,
      adExperience: "minimal",
      sellerAnalytics: true,
      softPostBoost: true,
      personalizedRecommendations: false,
    },
  },
  {
    level: "master",
    label: "지구",
    order: 60,
    principle: conveniencePrinciple,
    benefits: {
      savedPostLimit: null,
      savedPostFolders: true,
      priceChangeAlerts: "automatic",
      savedSearchFilters: true,
      quickFilters: true,
      scheduledBumps: "multiple",
      bulkPostManagement: true,
      notificationLevel: "personalized",
      profileEmphasis: "premium_badge",
      tradeStats: true,
      chatReadReceipts: true,
      quickReplies: true,
      autoReply: true,
      replyTemplates: true,
      imageReorder: true,
      featuredImageEmphasis: true,
      imageAutoEnhance: true,
      customThumbnail: true,
      adExperience: "minimal",
      sellerAnalytics: true,
      softPostBoost: true,
      personalizedRecommendations: true,
    },
  },
  {
    level: "master_plus",
    label: "푸른 지구+",
    order: 70,
    principle: conveniencePrinciple,
    benefits: {
      savedPostLimit: null,
      savedPostFolders: true,
      priceChangeAlerts: "automatic",
      savedSearchFilters: true,
      quickFilters: true,
      scheduledBumps: "repeating",
      bulkPostManagement: true,
      notificationLevel: "personalized",
      profileEmphasis: "premium_badge",
      tradeStats: true,
      chatReadReceipts: true,
      quickReplies: true,
      autoReply: true,
      replyTemplates: true,
      imageReorder: true,
      featuredImageEmphasis: true,
      imageAutoEnhance: true,
      customThumbnail: true,
      adExperience: "none",
      sellerAnalytics: true,
      softPostBoost: true,
      personalizedRecommendations: true,
    },
  },
] as const satisfies MembershipLevelConfig[];

export const defaultMembershipLevel: MembershipLevel = "iron";

export function getMembershipLevelConfig(level: MembershipLevel) {
  return (
    membershipLevels.find((membershipLevel) => membershipLevel.level === level) ??
    membershipLevels[0]
  );
}

export function getMembershipBenefits(level: MembershipLevel) {
  return getMembershipLevelConfig(level).benefits;
}
