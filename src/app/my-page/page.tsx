import { redirect } from "next/navigation";

import { MyPageDashboard } from "@/components/my-page/MyPageDashboard";
import { getUserChats } from "@/lib/chat-store";
import { getCurrentUser } from "@/lib/current-user";
import { getKeywordAlertSettings } from "@/lib/keyword-alert-store";
import { getMarketPostList, getUserMarketplaceComments } from "@/lib/marketplace-store";
import { getStoredUserComments, syncUserCommentsMarkdown } from "@/lib/user-comment-store";
import { syncUserBookmarksMarkdown } from "@/lib/user-bookmark-store";
import { syncUserPostsMarkdown } from "@/lib/user-post-store";

const myPageTabParams = {
  bookmarks: "북마크",
  chat: "1:1 채팅방",
  comments: "내가 쓴 댓글",
  keywords: "키워드 알람 설정",
  membership: "회원등급 / 포인트",
  posts: "내가 쓴 게시글",
  profile: "프로필 설정",
  security: "비밀번호 및 보안",
} as const;

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ chatId?: string; tab?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user) {
    redirect("/auth/login");
  }

  const [keywordAlerts, chatRooms, marketPosts, marketplaceComments, storedComments] = await Promise.all([
    getKeywordAlertSettings(user.id),
    getUserChats(user.id),
    getMarketPostList(user.id),
    getUserMarketplaceComments(user.id),
    getStoredUserComments(user.id),
  ]);
  const userComments = [...marketplaceComments, ...storedComments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const initialTab = params.tab && params.tab in myPageTabParams
    ? myPageTabParams[params.tab as keyof typeof myPageTabParams]
    : undefined;

  await syncUserCommentsMarkdown(userComments);
  await syncUserPostsMarkdown(user.id, marketPosts.filter((post) => post.isOwner));
  await syncUserBookmarksMarkdown(user.id, marketPosts.filter((post) => post.isBookmarked));

  return (
    <main className="my-page">
      <MyPageDashboard
        chatRooms={chatRooms}
        initialChatId={params.chatId}
        initialTab={initialTab}
        keywordAlerts={keywordAlerts}
        marketPosts={marketPosts}
        userComments={userComments}
        user={user}
      />
    </main>
  );
}
