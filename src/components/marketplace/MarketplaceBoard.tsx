"use client";

import Link from "next/link";
import { useState } from "react";

import { MarketplaceSidebar } from "@/components/marketplace/MarketplaceSidebar";
import {
  hamiltonSuburbs,
  marketItemCategories,
  marketRegions,
  marketSortOptions,
  marketStatuses,
} from "@/config/marketplace";
import type { MarketplaceMenu } from "@/features/marketplace/model/marketplace.model";
import { useLanguage } from "@/hooks/useLanguage";
import { formatRelativeTimeLabel, translate, translateMarketValue } from "@/lib/i18n";
import type { MarketStatus, PublicMarketPost } from "@/types/marketplace";
import { usePostListViewModel } from "@/viewmodels/usePostListViewModel";

type Props = {
  initialMenu?: MarketplaceMenu;
  initialNow: number;
  initialPosts: PublicMarketPost[];
  initialQuery?: string;
  initialSeller?: string;
  isLoggedIn: boolean;
  currentUserId?: string | null;
};

export function MarketplaceBoard({
  initialMenu = "개인판매",
  initialNow,
  initialPosts,
  initialQuery = "",
  initialSeller = "",
  isLoggedIn,
  currentUserId = null,
}: Props) {
  const { language } = useLanguage();
  const { actions, state } = usePostListViewModel({
    currentUserId,
    initialMenu,
    initialNow,
    initialPosts,
    initialQuery,
    initialSeller,
    translateError: (key) => translate(language, key),
  });
  const {
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
  } = state;
  const isBookmarkMenu = activeMenu === "북마크";
  function openPostFromCard(event: React.MouseEvent<HTMLElement>, postId: string) {
    if (isCardInteractiveTarget(event.target)) return;
    actions.openPost(postId);
  }

  function openPostFromCardKey(event: React.KeyboardEvent<HTMLElement>, postId: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (isCardInteractiveTarget(event.target)) return;

    event.preventDefault();
    actions.openPost(postId);
  }

  return (
    <section
      className={isSidebarCollapsed ? "market-layout sidebar-collapsed" : "market-layout"}
      aria-label={translate(language, "market.aria")}
    >
      <MarketplaceSidebar
        activeMenu={activeMenu}
        collapsed={isSidebarCollapsed}
        onSelect={actions.selectMenu}
        onToggleCollapse={() => actions.setIsSidebarCollapsed((current) => !current)}
      />

      <section className="market-main">
        <div className="market-mobile-menu">
          <MarketplaceSidebar activeMenu={activeMenu} mobileDrawer onSelect={actions.selectMenu} />
        </div>

        <form className="market-filters" data-open-filter={openFilter ?? "none"}>
          <div className="market-filter-strip">
            <div className="market-filter-grid">
              <SelectControl
                isOpen={openFilter === "region"}
                label={translate(language, "market.region")}
                onChange={actions.changeRegion}
                onClose={() => actions.setOpenFilter(null)}
                onToggle={() => actions.setOpenFilter((current) => (current === "region" ? null : "region"))}
                options={["전체", ...marketRegions]}
                optionLabel={(option) => translateMarketValue(language, option)}
                value={region}
              />
              {region === "Hamilton" ? (
                <SelectControl
                  isOpen={openFilter === "hamiltonSuburb"}
                  label={translate(language, "market.subRegion")}
                  onChange={actions.setHamiltonSuburb}
                  onClose={() => actions.setOpenFilter(null)}
                  onToggle={() =>
                    actions.setOpenFilter((current) => (current === "hamiltonSuburb" ? null : "hamiltonSuburb"))
                  }
                  options={["전체", ...hamiltonSuburbs]}
                  optionLabel={(option) => translateMarketValue(language, option)}
                  value={hamiltonSuburb}
                />
              ) : null}
              <SelectControl
                isOpen={openFilter === "itemCategory"}
                label={translate(language, "market.itemType")}
                onChange={actions.setItemCategory}
                onClose={() => actions.setOpenFilter(null)}
                onToggle={() => actions.setOpenFilter((current) => (current === "itemCategory" ? null : "itemCategory"))}
                options={["전체", ...marketItemCategories]}
                optionLabel={(option) => translateMarketValue(language, option)}
                value={itemCategory}
              />
              <SelectControl
                isOpen={openFilter === "status"}
                label={translate(language, "market.status")}
                onChange={actions.setStatus}
                onClose={() => actions.setOpenFilter(null)}
                onToggle={() => actions.setOpenFilter((current) => (current === "status" ? null : "status"))}
                options={["전체", ...marketStatuses]}
                optionLabel={(option) => translateMarketValue(language, option)}
                value={status}
              />
              <SelectControl
                isOpen={openFilter === "sort"}
                label={translate(language, "market.sort")}
                onChange={actions.setSort}
                onClose={() => actions.setOpenFilter(null)}
                onToggle={() => actions.setOpenFilter((current) => (current === "sort" ? null : "sort"))}
                options={marketSortOptions}
                optionLabel={(option) => translateMarketValue(language, option)}
                value={sort}
              />
            </div>
            <Link className="market-write-button" href={`/marketplace/new?menu=${writeMenuSlug}`}>
              {translate(language, "market.write")}
            </Link>
          </div>
        </form>

        {isManageMenu ? (
          <div className="market-bookmark-managebar" aria-label={translate(language, "market.bookmarkManage")}>
            <div>
              <strong>
                {isBookmarkMenu ? translate(language, "market.bookmarkManage") : translate(language, "market.mySaleManage")}
              </strong>
              <span>
                {selectedIds.size
                  ? translate(language, "market.selectedCount", { count: selectedIds.size })
                  : translate(language, "market.visibleCount", { count: visiblePosts.length })}
              </span>
            </div>
            <div className="market-filter-actions">
              <button
                className={isSelectionMode ? "market-manage-button active" : "market-manage-button"}
                disabled={!visiblePosts.length}
                onClick={actions.toggleSelectionMode}
                type="button"
              >
                {translate(language, "common.select")}
              </button>
              <button
                className="market-manage-button"
                disabled={!visiblePosts.length}
                onClick={actions.toggleAllVisible}
                type="button"
              >
                {allVisibleSelected ? translate(language, "common.clearAll") : translate(language, "common.selectAll")}
              </button>
              <button
                className="market-manage-button danger"
                disabled={!selectedIds.size || isDeletingManagedItems}
                onClick={actions.deleteSelectedManagedItems}
                type="button"
              >
                {isDeletingManagedItems ? translate(language, "common.deleting") : translate(language, "common.delete")}
              </button>
            </div>
          </div>
        ) : null}

        {statusMessage ? <p className="form-error">{statusMessage}</p> : null}

        <div className="market-post-list market-post-list--animated" aria-label={translate(language, "market.postList")}>
          {visiblePosts.length ? (
            visiblePosts.map((post, index) => (
              <article
                aria-label={translate(language, "market.postDetail", { title: post.title })}
                className={`market-card market-card--reveal status-${getStatusClassName(post.status)}`}
                key={post.id}
                onClick={(event) => openPostFromCard(event, post.id)}
                onKeyDown={(event) => openPostFromCardKey(event, post.id)}
                role="link"
                style={{ animationDelay: `${Math.min(index, 14) * 42}ms` }}
                tabIndex={0}
              >
                <div className="market-card__media">
                  {isManageMenu && isSelectionMode ? (
                    <label className="market-card-selector">
                      <input
                        aria-label={translate(language, "market.postSelect", { title: post.title })}
                        checked={selectedIds.has(post.id)}
                        onChange={() => actions.togglePostSelection(post.id)}
                        type="checkbox"
                      />
                    </label>
                  ) : null}
                  <Link
                    className={`market-thumb status-${getStatusClassName(post.status)}`}
                    href={`/marketplace/${post.id}`}
                    aria-label={translate(language, "market.postRead", { title: post.title })}
                  >
                    {post.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={post.coverImageUrl} />
                    ) : null}
                  </Link>
                </div>
                <div className="market-card__body">
                  <h3>
                    <Link href={`/marketplace/${post.id}`}>{post.title}</Link>
                    {post.commentCount > 0 ? (
                      <span className={getCommentCountClassName(post.commentCount)}>{post.commentCount}</span>
                    ) : null}
                  </h3>
                  <div className="market-author">
                    {post.authorProfileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={post.authorProfileImageUrl} />
                    ) : (
                      <span aria-hidden="true">{post.authorNickname.slice(0, 1)}</span>
                    )}
                    {post.authorNickname} ·{" "}
                    <span className="market-relative-time" suppressHydrationWarning>
                      {formatRelativeTimeLabel(language, post.createdAt, initialNow)}
                    </span>
                    <span className="market-inline-views">· {post.viewCount}</span>
                  </div>
                  <div className="market-card__stats" aria-label={translate(language, "market.reactions")}>
                    <span>{translateMarketValue(language, post.itemCondition)}</span>
                    <span className="market-card__trade-method">{translateMarketValue(language, post.tradeMethod)}</span>
                    <span>{post.region}</span>
                  </div>
                </div>
                <div className="market-card__side">
                  <div className="market-card__price-line">
                    <strong>{translateMarketValue(language, post.priceLabel)}</strong>
                    <div className="market-mobile-status">
                      <span className={`market-status ${getStatusClassName(post.status)}`}>
                        {translateMarketValue(language, post.status)}
                      </span>
                    </div>
                    <div className="market-desktop-status">
                      <span className={`market-status ${getStatusClassName(post.status)}`}>
                        {translateMarketValue(language, post.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="market-empty">
              {isBookmarkMenu ? translate(language, "market.noBookmarks") : translate(language, "market.noPosts")}
            </div>
          )}
        </div>
      </section>

        <MarketplaceRightRail posts={railPosts} />
    </section>
  );
}

export function MarketplaceRightRail({
  posts,
}: {
  posts: PublicMarketPost[];
}) {
  const { language } = useLanguage();
  const [visiblePopularCount, setVisiblePopularCount] = useState(5);
  const visiblePopularPosts = posts.slice(0, visiblePopularCount);
  const hasMorePopularPosts = visiblePopularCount < posts.length;

  return (
    <aside className="market-right-rail" aria-label={translate(language, "market.aria")}>
      <div className="market-right-rail__sticky">
        <section className="market-rail-section market-rail-ad">
          <span>{translate(language, "market.ad")}</span>
          <h3>{translate(language, "market.ad")}</h3>
          <p>{translate(language, "market.adDescription")}</p>
          <Link href="/my-page">{translate(language, "market.ad")}</Link>
        </section>

        <section className="market-rail-section">
          <div className="market-rail-section__head">
            <span>{translate(language, "market.popular")}</span>
          </div>
          <div className="market-rail-list">
            {visiblePopularPosts.map((post) => (
              <Link href={`/marketplace/${post.id}`} key={post.id}>
                <strong>{post.title}</strong>
                <span>
                  {post.region} · {translate(language, "market.views")} {post.viewCount} ·{" "}
                  {translate(language, "market.comments")} {post.commentCount}
                </span>
              </Link>
            ))}
          </div>
          {hasMorePopularPosts ? (
            <button
              className="market-rail-more"
              onClick={() => setVisiblePopularCount((count) => Math.min(count + 5, posts.length))}
              type="button"
            >
              {translate(language, "common.more")}
            </button>
          ) : null}
        </section>

        <section className="market-rail-section market-rail-info">
          <div className="market-rail-section__head">
            <span>{translate(language, "market.guideLabel")}</span>
            <h3>{translate(language, "market.tradeCheck")}</h3>
          </div>
          <ul>
            <li>{translate(language, "market.guideMeetPublic")}</li>
            <li>{translate(language, "market.guideCheckPayment")}</li>
            <li>{translate(language, "market.guideStopSuspicious")}</li>
          </ul>
        </section>

        <section className="market-rail-section market-rail-native">
          <span>{translate(language, "market.ad")}</span>
          <h3>{translate(language, "market.ad")}</h3>
          <p>{translate(language, "market.adDescription")}</p>
        </section>
      </div>
    </aside>
  );
}

function isCardInteractiveTarget(target: EventTarget) {
  return target instanceof Element && Boolean(target.closest("a, button, input, label, select, textarea"));
}

function SelectControl({
  isOpen,
  label,
  onClose,
  onChange,
  onToggle,
  options,
  optionLabel,
  value,
}: {
  isOpen: boolean;
  label: string;
  onClose: () => void;
  onChange: (value: string) => void;
  onToggle: () => void;
  options: string[];
  optionLabel?: (value: string) => string;
  value: string;
}) {
  const { language } = useLanguage();
  const visibleValue = optionLabel ? optionLabel(value) : value;

  return (
    <div className="market-filter-control">
      <span>{label}</span>
      <div className={`market-filter-select${isOpen ? " open" : ""}`}>
        <button
          aria-expanded={isOpen}
          aria-label={translate(language, "market.filterLabel", { label, value: visibleValue })}
          className="market-filter-trigger"
          onClick={onToggle}
          type="button"
        >
          <span>{visibleValue}</span>
        </button>
        {isOpen ? (
          <div className="market-filter-menu" role="listbox" aria-label={label}>
            {options.map((option) => (
              <button
                aria-selected={option === value}
                className={option === value ? "active" : ""}
                key={option}
                onClick={() => {
                  onChange(option);
                  onClose();
                }}
                role="option"
                type="button"
              >
                {optionLabel ? optionLabel(option) : option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getStatusClassName(status: MarketStatus) {
  if (status === "거래중" || status === "거래완료 대기") return "pending";
  if (status === "판매완료") return "done";
  return "selling";
}

function getCommentCountClassName(commentCount: number) {
  if (commentCount >= 50) return "comment-count-level-50";
  if (commentCount >= 40) return "comment-count-level-40";
  if (commentCount >= 30) return "comment-count-level-30";
  if (commentCount >= 20) return "comment-count-level-20";
  if (commentCount >= 11) return "comment-count-level-11";
  return "comment-count-level-10";
}
