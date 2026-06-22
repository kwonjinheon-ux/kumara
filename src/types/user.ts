import type { MembershipBenefits, MembershipLevel } from "@/config/membershipLevels";

export type UserRole =
  | "guest"
  | "member"
  | "verified_member"
  | "business_member"
  | "moderator"
  | "admin"
  | "super_admin";

export type UserStatus =
  | "active"
  | "pending_verification"
  | "suspended"
  | "deleted";

export type PublicUser = {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  referralId: string | null;
  profile: UserProfile;
  role: UserRole;
  membershipLevel: MembershipLevel;
  membershipBenefits?: MembershipBenefits;
  status: UserStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
};

export type StoredUser = PublicUser & {
  passwordHash: string;
  acceptedTermsAt: string;
  confirmedAge14At: string;
  authProvider?: "email" | "google";
  googleId?: string | null;
};

export type UserProfile = {
  profileImageUrl: string | null;
  profileImageScale: number;
  profileImageX: number;
  profileImageY: number;
  smartphoneNumber: string | null;
  kakaoTalkId: string | null;
  bio: string | null;
  city: string | null;
  suburb: string | null;
  showKakaoTalkId: boolean;
  showPhoneNumber: boolean;
  allowChat: boolean;
  interests: string[];
  preferredLanguage: "ko" | "en" | "both";
  notificationComments: boolean;
  notificationSavedPosts: boolean;
  notificationTradeMessages: boolean;
  tradeArea: string | null;
  businessInterested: boolean;
  businessName: string | null;
  businessDescription: string | null;
  residencyStatus: string | null;
  hasCar: boolean | null;
  lifeInfoInterests: string[];
};
