"use client";

import { Suspense, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { MyPageDashboard } from "@/components/my-page/MyPageDashboard";
import { listFirebaseMarketPosts } from "@/lib/firebase-marketplace";
import type { KeywordAlertSettings } from "@/types/keyword-alert";
import type { PublicMarketPost } from "@/types/marketplace";
import type { PublicUser, UserProfile } from "@/types/user";

const defaultKeywordAlerts: KeywordAlertSettings = {
  categoryScope: [],
  isActive: true,
  keywords: [],
  notifyEmail: false,
  notifyInApp: true,
  notifyPush: false,
  updatedAt: null,
};

const defaultProfile: UserProfile = {
  allowChat: true,
  bio: null,
  businessDescription: null,
  businessInterested: false,
  businessName: null,
  city: null,
  hasCar: null,
  interests: [],
  kakaoTalkId: null,
  lifeInfoInterests: [],
  notificationComments: true,
  notificationSavedPosts: true,
  notificationTradeMessages: true,
  preferredLanguage: "ko",
  profileImageScale: 1,
  profileImageUrl: null,
  profileImageX: 0,
  profileImageY: 0,
  residencyStatus: null,
  showKakaoTalkId: false,
  showPhoneNumber: false,
  smartphoneNumber: null,
  suburb: null,
  tradeArea: null,
};

export default function MyPage() {
  return (
    <Suspense fallback={<main className="my-page">Loading...</main>}>
      <MyPageContent />
    </Suspense>
  );
}

function MyPageContent() {
  const { firebaseUser, loading, profile } = useAuth();
  const [marketPosts, setMarketPosts] = useState<PublicMarketPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setMarketPosts([]);
      setPostsLoading(false);
      return;
    }

    let cancelled = false;
    setPostsLoading(true);

    listFirebaseMarketPosts(firebaseUser.uid)
      .then((posts) => {
        if (!cancelled) setMarketPosts(posts);
      })
      .catch((error) => {
        console.error("Failed to load my-page marketplace posts.", error);
        if (!cancelled) setMarketPosts([]);
      })
      .finally(() => {
        if (!cancelled) setPostsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [firebaseUser]);

  const user = useMemo<PublicUser | null>(() => {
    if (!firebaseUser) return null;

    return {
      createdAt: firebaseUser.metadata.creationTime ?? new Date().toISOString(),
      email: firebaseUser.email,
      id: firebaseUser.uid,
      isEmailVerified: firebaseUser.emailVerified,
      isPhoneVerified: Boolean(firebaseUser.phoneNumber),
      membershipLevel: "iron",
      nickname:
        profile?.displayName ||
        firebaseUser.displayName ||
        firebaseUser.email?.split("@")[0] ||
        "User",
      phone: firebaseUser.phoneNumber,
      profile: {
        ...defaultProfile,
        profileImageUrl: profile?.photoURL ?? firebaseUser.photoURL,
      },
      referralId: null,
      role: firebaseUser.emailVerified ? "verified_member" : "member",
      status: firebaseUser.emailVerified ? "active" : "pending_verification",
    };
  }, [firebaseUser, profile]);

  if (loading || postsLoading) {
    return <main className="my-page">Loading...</main>;
  }

  if (!firebaseUser || !user) {
    return (
      <main className="my-page">
        <p className="form-error">로그인이 필요합니다.</p>
      </main>
    );
  }

  return (
    <main className="my-page">
      <MyPageDashboard
        chatRooms={[]}
        keywordAlerts={defaultKeywordAlerts}
        marketPosts={marketPosts}
        user={user}
        userComments={[]}
      />
    </main>
  );
}
