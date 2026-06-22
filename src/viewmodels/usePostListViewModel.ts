"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { marketBoardTypes } from "@/config/marketplace";
import type { MarketplaceMenu } from "@/features/marketplace/model/marketplace.model";
import {
  getMarketMenuSlug,
  selectMarketplaceRailPosts,
  selectVisibleMarketPosts,
} from "@/features/marketplace/view-model/marketplace-board.vm";
import { postService } from "@/services/postService";
import type { PublicMarketPost } from "@/types/marketplace";

const MARKETPLACE_SEARCH_EVENT = "kumara:marketplace-search";

type UsePostListViewModelInput = {
  currentUserId?: string | null;
  initialMenu: MarketplaceMenu;
  initialNow: number;
  initialPosts: PublicMarketPost[];
  initialQuery: string;
  initialSeller: string;
  translateError: (key: "error.deleteBookmarks" | "error.deletePosts") => string;
};

// ViewModel owns marketplace list state, filters, loading flags, and button actions.
export function usePostListViewModel({
  currentUserId,
  initialMenu,
  initialNow,
  initialPosts,
  initialQuery,
  initialSeller,
  translateError,
}: UsePostListViewModelInput) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [activeSeller, setActiveSeller] = useState(initialSeller);
  const [region, setRegion] = useState("전체");
  const [hamiltonSuburb, setHamiltonSuburb] = useState("전체");
  const [itemCategory, setItemCategory] = useState("전체");
  const [status, setStatus] = useState("전체");
  const [sort, setSort] = useState("최신순");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBookmarks, setIsDeletingBookmarks] = useState(false);
  const [isDeletingPosts, setIsDeletingPosts] = useState(false);
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  useEffect(() => setActiveQuery(initialQuery), [initialQuery]);
  useEffect(() => setActiveMenu(initialMenu), [initialMenu]);
  useEffect(() => setActiveSeller(initialSeller), [initialSeller]);

  useEffect(() => {
    function onRealtimeSearch(event: Event) {
      const query = (event as CustomEvent<{ query?: string }>).detail?.query ?? "";
      setActiveQuery(query);
      setActiveSeller("");
    }

    window.addEventListener(MARKETPLACE_SEARCH_EVENT, onRealtimeSearch);
    return () => window.removeEventListener(MARKETPLACE_SEARCH_EVENT, onRealtimeSearch);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const shouldNormalizeMenu = !url.searchParams.has("menu") || url.searchParams.has("tab");

    if (!shouldNormalizeMenu) return;

    url.searchParams.set("menu", getMarketMenuSlug(initialMenu));
    url.searchParams.delete("tab");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [initialMenu]);

  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setStatusMessage(null);
    setOpenFilter(null);
  }, [activeMenu]);

  const visiblePosts = useMemo(() => {
    return selectVisibleMarketPosts({
      filters: {
        activeMenu,
        activeQuery,
        hamiltonSuburb,
        initialSeller: activeSeller,
        itemCategory,
        region,
        sort,
        status,
      },
      now: initialNow,
      posts,
    });
  }, [activeMenu, activeQuery, activeSeller, hamiltonSuburb, initialNow, itemCategory, posts, region, sort, status]);

  const railPosts = useMemo(() => selectMarketplaceRailPosts(posts, initialNow), [initialNow, posts]);
  const activeMenuSlug = getMarketMenuSlug(activeMenu);
  const isBookmarkMenu = activeMenuSlug === "bookmarks";
  const isSellManageMenu = activeMenuSlug === "my-posts";
  const isManageMenu = isBookmarkMenu || isSellManageMenu;
  const writeMenuSlug = marketBoardTypes.includes(activeMenu as (typeof marketBoardTypes)[number])
    ? getMarketMenuSlug(activeMenu)
    : "sell";
  const isDeletingManagedItems = isBookmarkMenu ? isDeletingBookmarks : isDeletingPosts;
  const allVisibleSelected = visiblePosts.length > 0 && visiblePosts.every((post) => selectedIds.has(post.id));

  function changeRegion(nextRegion: string) {
    setRegion(nextRegion);
    if (nextRegion !== "Hamilton") {
      setHamiltonSuburb("전체");
    }
  }

  function selectMenu(nextMenu: MarketplaceMenu) {
    setActiveMenu(nextMenu);
    setActiveQuery("");
    setActiveSeller("");
    router.push(`/marketplace?menu=${getMarketMenuSlug(nextMenu)}`);
  }

  function toggleSelectionMode() {
    setIsSelectionMode((current) => {
      if (current) setSelectedIds(new Set());
      return !current;
    });
  }

  function togglePostSelection(postId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visiblePosts.forEach((post) => next.delete(post.id));
      } else {
        visiblePosts.forEach((post) => next.add(post.id));
      }
      return next;
    });
  }

  async function deleteSelectedBookmarks() {
    if (!selectedIds.size || !currentUserId) return;

    setIsDeletingBookmarks(true);
    setStatusMessage(null);

    try {
      const deletedIds = new Set(await postService.deleteBookmarks(currentUserId, [...selectedIds]));
      setPosts((current) =>
        current.map((post) =>
          deletedIds.has(post.id)
            ? {
                ...post,
                bookmarkCount: Math.max(0, post.bookmarkCount - 1),
                bookmarkedAt: null,
                isBookmarked: false,
              }
            : post,
        ),
      );
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : translateError("error.deleteBookmarks"));
    } finally {
      setIsDeletingBookmarks(false);
    }
  }

  async function deleteSelectedPosts() {
    if (!selectedIds.size) return;

    setIsDeletingPosts(true);
    setStatusMessage(null);

    try {
      const deletedIds = new Set(await postService.deletePosts([...selectedIds]));
      setPosts((current) => current.filter((post) => !deletedIds.has(post.id)));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : translateError("error.deletePosts"));
    } finally {
      setIsDeletingPosts(false);
    }
  }

  function deleteSelectedManagedItems() {
    if (isBookmarkMenu) {
      void deleteSelectedBookmarks();
      return;
    }

    void deleteSelectedPosts();
  }

  function openPost(postId: string) {
    router.push(`/marketplace/${postId}`);
  }

  return {
    actions: {
      changeRegion,
      deleteSelectedManagedItems,
      openPost,
      selectMenu,
      setHamiltonSuburb,
      setItemCategory,
      setOpenFilter,
      setIsSidebarCollapsed,
      setSort,
      setStatus,
      toggleAllVisible,
      togglePostSelection,
      toggleSelectionMode,
    },
    state: {
      activeMenu,
      allVisibleSelected,
      hamiltonSuburb,
      isDeletingManagedItems,
      isManageMenu,
      isSelectionMode,
      isSidebarCollapsed,
      itemCategory,
      openFilter,
      railPosts,
      region,
      selectedIds,
      sort,
      status,
      statusMessage,
      visiblePosts,
      writeMenuSlug,
    },
  };
}
