import { notFound, redirect } from "next/navigation";

import { MarketplaceRightRail } from "@/components/marketplace/MarketplaceBoard";
import { MarketplacePostForm } from "@/components/marketplace/MarketplacePostForm";
import { MarketplaceSidebar } from "@/components/marketplace/MarketplaceSidebar";
import { getMarketplaceImageLimit } from "@/config/marketplace";
import { getCurrentUser } from "@/lib/current-user";
import { getWeeklyPopularMarketPosts } from "@/lib/marketplace-popular";
import { getMarketPostById, getMarketPostList } from "@/lib/marketplace-store";

export default async function MarketplaceEditPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const post = await getMarketPostById(postId, user.id);

  if (!post) {
    notFound();
  }

  if (!post.isOwner && !["admin", "super_admin", "moderator"].includes(user.role)) {
    redirect(`/marketplace/${post.id}`);
  }

  if (post.status === "판매완료") {
    redirect(`/marketplace/${post.id}`);
  }

  const imageLimit = getMarketplaceImageLimit(user.membershipLevel);
  const posts = await getMarketPostList(user.id);
  const railPosts = getWeeklyPopularMarketPosts(posts, {
    excludeId: post.id,
    limit: 5,
  });

  return (
    <main className="market-page">
      <section className="market-layout market-compose-layout" aria-label="마켓플레이스 글수정">
        <MarketplaceSidebar activeMenu="개인판매" />
        <div className="market-main market-form-shell" id="top">
          <div className="market-mobile-menu">
            <MarketplaceSidebar activeMenu="개인판매" mobileDrawer />
          </div>
          <MarketplacePostForm
            imageLimit={imageLimit}
            initialPost={post}
            mode="edit"
            userContact={{
              allowChat: user.profile.allowChat,
              email: user.email,
              kakaoTalkId: user.profile.kakaoTalkId,
              smartphoneNumber: user.profile.smartphoneNumber,
            }}
          />
        </div>
        <MarketplaceRightRail posts={railPosts} />
      </section>
    </main>
  );
}
