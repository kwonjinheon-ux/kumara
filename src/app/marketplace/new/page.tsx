import { redirect } from "next/navigation";

import { MarketplaceRightRail } from "@/components/marketplace/MarketplaceBoard";
import { MarketplacePostForm } from "@/components/marketplace/MarketplacePostForm";
import { MarketplaceSidebar } from "@/components/marketplace/MarketplaceSidebar";
import { getMarketplaceImageLimit } from "@/config/marketplace";
import { normalizeMarketMenu } from "@/features/marketplace/view-model/marketplace-board.vm";
import { getCurrentUser } from "@/lib/current-user";
import { getWeeklyPopularMarketPosts } from "@/lib/marketplace-popular";
import { getMarketPostList } from "@/lib/marketplace-store";
import type { MarketBoardType } from "@/types/marketplace";

type MarketplaceNewPageProps = {
  searchParams?: Promise<{
    menu?: string | string[];
  }>;
};

export default async function MarketplaceNewPage({ searchParams }: MarketplaceNewPageProps) {
  const params = await searchParams;
  const rawMenu = Array.isArray(params?.menu) ? params.menu[0] ?? "" : params?.menu ?? "";
  const activeMenu = normalizeMarketMenu(rawMenu);
  const initialBoardType = getInitialBoardType(activeMenu);
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const imageLimit = getMarketplaceImageLimit(user.membershipLevel);
  const posts = await getMarketPostList(user.id);
  const railPosts = getWeeklyPopularMarketPosts(posts, { limit: 5 });

  return (
    <main className="market-page">
      <section className="market-layout market-compose-layout">
        <MarketplaceSidebar activeMenu={initialBoardType} />
        <div className="market-main market-form-shell" id="top">
          <div className="market-mobile-menu">
            <MarketplaceSidebar activeMenu={initialBoardType} mobileDrawer />
          </div>
          <MarketplacePostForm
            imageLimit={imageLimit}
            initialBoardType={initialBoardType}
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

function getInitialBoardType(menu: string): MarketBoardType {
  if (menu === "개인구매") return "개인구매";
  if (menu === "무료나눔") return "무료나눔";
  if (menu === "업체판매") return "업체판매";
  if (menu === "공동구매") return "공동구매";
  return "개인판매";
}
