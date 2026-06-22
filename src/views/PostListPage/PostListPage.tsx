import { MarketplaceBoard } from "@/components/marketplace/MarketplaceBoard";
import type { MarketplaceMenu } from "@/features/marketplace/model/marketplace.model";
import type { User } from "@/models/User";
import type { Post } from "@/models/Post";

import styles from "./PostListPage.module.css";

// PostListPage View only renders the list surface and receives prepared data.
export function PostListPageView({
  initialMenu,
  initialNow,
  initialPosts,
  initialQuery,
  initialSeller,
  user,
}: {
  initialMenu: MarketplaceMenu;
  initialNow: number;
  initialPosts: Post[];
  initialQuery: string;
  initialSeller: string;
  user: User | null;
}) {
  return (
    <main className={`${styles.page} market-page`}>
      <MarketplaceBoard
        currentUserId={user?.id ?? null}
        initialMenu={initialMenu}
        initialNow={initialNow}
        initialPosts={initialPosts}
        initialQuery={initialQuery}
        initialSeller={initialSeller}
        isLoggedIn={Boolean(user)}
      />
    </main>
  );
}
