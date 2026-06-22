"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useLanguage } from "@/hooks/useLanguage";
import { formatRelativeTimeLabel, translate, translateMarketValue } from "@/lib/i18n";
import type { PublicMarketPost } from "@/types/marketplace";

type MarketplaceRelatedPostsProps = {
  initialNow: number;
  posts: PublicMarketPost[];
};

const PAGE_SIZE = 10;

export function MarketplaceRelatedPosts({ initialNow, posts }: MarketplaceRelatedPostsProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [posts]);

  if (!posts.length) {
    return null;
  }

  function openPostFromCard(event: React.MouseEvent<HTMLElement>, postId: string) {
    if (isCardInteractiveTarget(event.target)) return;
    router.push(`/marketplace/${postId}`);
  }

  function openPostFromCardKey(event: React.KeyboardEvent<HTMLElement>, postId: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (isCardInteractiveTarget(event.target)) return;

    event.preventDefault();
    router.push(`/marketplace/${postId}`);
  }

  return (
    <section className="market-related-posts" aria-label={translate(language, "market.sameCategory")}>
      <div className="market-related-posts__head">
        <strong>{translate(language, "market.sameCategory")}</strong>
        <span>{translate(language, "market.visibleCount", { count: posts.length })}</span>
      </div>

      <div className="market-post-list market-related-posts__list" aria-label={translate(language, "market.postList")}>
        {visiblePosts.map((post) => (
          <article
            aria-label={translate(language, "market.postDetail", { title: post.title })}
            className={`market-card status-${getStatusClassName(post.status)}`}
            key={post.id}
            onClick={(event) => openPostFromCard(event, post.id)}
            onKeyDown={(event) => openPostFromCardKey(event, post.id)}
            role="link"
            tabIndex={0}
          >
            <div className="market-card__media">
              <Link
                className={`market-thumb status-${getStatusClassName(post.status)}`}
                href={`/marketplace/${post.id}`}
                aria-label={translate(language, "market.postRead", { title: post.title })}
              >
                {post.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={post.coverImageUrl} loading="lazy" />
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
                  <img alt="" src={post.authorProfileImageUrl} loading="lazy" />
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
        ))}
      </div>

      {hasMore ? (
        <button
          className="market-related-posts__more"
          onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, posts.length))}
          type="button"
        >
          {translate(language, "common.more")}
        </button>
      ) : null}
    </section>
  );
}

function isCardInteractiveTarget(target: EventTarget) {
  return target instanceof Element && Boolean(target.closest("a, button, input, label, select, textarea"));
}

function getStatusClassName(status: string) {
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
