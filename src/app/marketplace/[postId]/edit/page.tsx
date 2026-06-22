import { notFound } from "next/navigation";

import { MarketplaceRightRail } from "@/components/marketplace/MarketplaceBoard";
import { MarketplacePostForm } from "@/components/marketplace/MarketplacePostForm";
import { MarketplaceSidebar } from "@/components/marketplace/MarketplaceSidebar";
import { getMarketplaceImageLimit } from "@/config/marketplace";
import { getFirebaseMarketPost, listFirebaseMarketPosts } from "@/lib/firebase-marketplace";
import { getWeeklyPopularMarketPosts } from "@/lib/marketplace-popular";

export default async function MarketplaceEditPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const user = {
    email: null,
    membershipLevel: "iron" as const,
    profile: {
      allowChat: true,
      kakaoTalkId: null,
      smartphoneNumber: null,
    },
  };

  if (!user) {
    notFound();
  }

  const post = await getFirebaseMarketPost(postId);

  if (!post) {
    notFound();
  }

  if (false) {
    notFound();
  }

  if (post.status === "판매완료") {
    notFound();
  }

  const imageLimit = getMarketplaceImageLimit(user.membershipLevel);
  const posts = await listFirebaseMarketPosts();
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
