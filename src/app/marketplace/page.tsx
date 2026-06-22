import { normalizeMarketMenu } from "@/features/marketplace/view-model/marketplace-board.vm";
import { listFirebaseMarketPosts } from "@/lib/firebase-marketplace";
import { PostListPageView } from "@/views/PostListPage/PostListPage";

type MarketplacePageProps = {
  searchParams?: Promise<{
    menu?: string | string[];
    q?: string | string[];
    seller?: string | string[];
    tab?: string | string[];
  }>;
};

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams;
  const initialQuery = Array.isArray(params?.q) ? params.q[0] ?? "" : params?.q ?? "";
  const initialSeller = Array.isArray(params?.seller) ? params.seller[0] ?? "" : params?.seller ?? "";
  const rawInitialMenu = Array.isArray(params?.menu)
    ? params.menu[0] ?? ""
    : params?.menu ?? (Array.isArray(params?.tab) ? params.tab[0] ?? "" : params?.tab ?? "");
  const user = null;
  const posts = await listFirebaseMarketPosts();

  return (
    <PostListPageView
      initialMenu={normalizeMarketMenu(rawInitialMenu)}
      initialNow={Date.now()}
      initialPosts={posts}
      initialQuery={initialQuery}
      initialSeller={initialSeller}
      user={user}
    />
  );
}
