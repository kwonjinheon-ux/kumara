"use client";

import Link from "next/link";
import { useState } from "react";

import type { PublicMarketPost } from "@/types/marketplace";

type Props = {
  initialPost: PublicMarketPost;
  isLoggedIn: boolean;
};

type IconName = "arrowDown" | "arrowUp" | "comment" | "edit" | "eye" | "heart" | "rocket" | "trash";
type PostActionPatch = Partial<
  Pick<
    PublicMarketPost,
    | "bumpedAt"
    | "bookmarkCount"
    | "commentCount"
    | "downvoteCount"
    | "isBookmarked"
    | "isBoosted"
    | "nextBumpAvailableAt"
    | "status"
    | "updatedAt"
    | "upvoteCount"
    | "userVote"
    | "viewCount"
  >
>;

export function MarketplacePostActions({ initialPost, isLoggedIn }: Props) {
  const [post, setPost] = useState(initialPost);
  const [message, setMessage] = useState<string | null>(null);
  const [heartBurst, setHeartBurst] = useState(0);
  const [voteBurst, setVoteBurst] = useState(0);
  const isSold = post.status === "판매완료";
  const bumpLocked = Boolean(
    post.nextBumpAvailableAt && Date.now() < new Date(post.nextBumpAvailableAt).getTime(),
  );
  const bumpRemainingLabel = getBumpRemainingLabel(post.nextBumpAvailableAt);

  async function toggleBookmark() {
    if (!isLoggedIn) {
      window.location.assign("/auth/login");
      return;
    }

    const previousPost = post;
    const nextBookmarked = !post.isBookmarked;
    const nextPatch = {
      bookmarkCount: Math.max(0, post.bookmarkCount + (nextBookmarked ? 1 : -1)),
      isBookmarked: nextBookmarked,
    };

    setMessage(null);
    setPost((current) => ({ ...current, ...nextPatch }));
    if (nextBookmarked) setHeartBurst((current) => current + 1);
    await runAction(`/api/marketplace/posts/${post.id}/bookmark`, {}, previousPost);
  }

  async function vote(voteType: "up" | "down") {
    if (!isLoggedIn) {
      window.location.assign("/auth/login");
      return;
    }

    const previousPost = post;
    const nextVote = post.userVote === voteType ? null : voteType;
    const hadUpvote = post.userVote === "up";
    const hadDownvote = post.userVote === "down";

    setMessage(null);
    setVoteBurst((current) => current + 1);
    setPost((current) => ({
      ...current,
      downvoteCount: Math.max(0, current.downvoteCount - (hadDownvote ? 1 : 0) + (nextVote === "down" ? 1 : 0)),
      upvoteCount: Math.max(0, current.upvoteCount - (hadUpvote ? 1 : 0) + (nextVote === "up" ? 1 : 0)),
      userVote: nextVote,
    }));
    await runAction(`/api/marketplace/posts/${post.id}/vote`, { vote: nextVote }, previousPost);
  }

  async function bumpPost() {
    if (!isLoggedIn) {
      window.location.assign("/auth/login");
      return;
    }

    const previousPost = post;
    setMessage(null);
    setPost((current) => ({ ...current, isBoosted: true }));
    await runAction(`/api/marketplace/posts/${post.id}/bump`, {}, previousPost);
  }

  async function deletePost() {
    if (!isLoggedIn) {
      window.location.assign("/auth/login");
      return;
    }

    if (!window.confirm("이 게시글을 삭제할까요?")) return;

    setMessage(null);
    const response = await fetch(`/api/marketplace/posts/${post.id}`, {
      credentials: "same-origin",
      method: "DELETE",
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(result?.error ?? "게시글을 삭제하지 못했습니다.");
      return;
    }

    window.location.assign("/marketplace");
  }

  async function runAction(url: string, body: Record<string, unknown>, previousPost: PublicMarketPost) {
    const response = await fetch(url, {
      body: JSON.stringify(body),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "요청을 처리하지 못했습니다.");
      setPost(previousPost);
      return;
    }

    setPost((current) => ({ ...current, ...(result.post as PostActionPatch) }));
  }

  return (
    <section className="market-detail-actions" aria-label="게시글 참여">
      <div className="market-detail-actions__main">
        <div className="market-detail-vote-pill">
          {voteBurst ? (
            <span className="vote-burst" key={voteBurst} aria-hidden="true">
              <i>+1</i>
              <i>★</i>
              <i>↑</i>
              <i>✓</i>
            </span>
          ) : null}
          <button
            aria-label="추천"
            className={post.userVote === "up" ? "active" : ""}
            onClick={() => vote("up")}
            type="button"
          >
            <ActionIcon name="arrowUp" />
          </button>
          <strong>{Math.max(0, post.upvoteCount - post.downvoteCount)}</strong>
          <button
            aria-label="비추천"
            className={post.userVote === "down" ? "active" : ""}
            onClick={() => vote("down")}
            type="button"
          >
            <ActionIcon name="arrowDown" />
          </button>
        </div>

        <button
          className={post.isBookmarked ? "market-bookmark-button active" : "market-bookmark-button"}
          onClick={toggleBookmark}
          type="button"
        >
          <span className="market-bookmark-emoji" aria-hidden="true">
            {post.isBookmarked ? "❤️" : "🤍"}
          </span>
          북마크 {post.bookmarkCount}
          {heartBurst ? (
            <span className="heart-burst" key={heartBurst} aria-hidden="true">
              <i>♥</i>
              <i>♥</i>
              <i>♥</i>
              <i>♥</i>
              <i>♥</i>
              <i>♥</i>
              <i>♥</i>
              <i>♥</i>
            </span>
          ) : null}
        </button>

        <div className="market-detail-actions__meta">
          <span className="market-detail-meta-pill">
            조회 {post.viewCount}
          </span>
          <span className="market-detail-meta-pill">
            댓글 {post.commentCount}
          </span>
        </div>
      </div>

      {post.isOwner ? (
        <div className="market-detail-owner-actions" aria-label="내 글 관리">
          {isSold ? null : (
            <Link className="market-owner-action edit" href={`/marketplace/${post.id}/edit`}>
              수정
            </Link>
          )}
          <button className="market-owner-action delete" onClick={deletePost} type="button">
            삭제
          </button>
          <button className="market-owner-action bump" disabled={bumpLocked} onClick={bumpPost} type="button">
            {bumpRemainingLabel ? `${bumpRemainingLabel} 남음` : "끌어올리기"}
          </button>
        </div>
      ) : null}

      {message ? <p className="form-error">{message}</p> : null}
    </section>
  );
}

function getBumpRemainingLabel(nextBumpAvailableAt: string | null) {
  if (!nextBumpAvailableAt) return null;

  const remainingMs = new Date(nextBumpAvailableAt).getTime() - Date.now();
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return null;

  const totalMinutes = Math.ceil(remainingMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

function ActionIcon({ filled = false, name }: { filled?: boolean; name: IconName }) {
  const commonProps = {
    "aria-hidden": true,
    className: "market-action-icon",
    fill: filled ? "currentColor" : "none",
    focusable: false,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  return (
    <svg {...commonProps}>
      {name === "arrowUp" ? <path d="M12 19V5m0 0 6 6m-6-6-6 6" /> : null}
      {name === "arrowDown" ? <path d="M12 5v14m0 0 6-6m-6 6-6-6" /> : null}
      {name === "heart" ? (
        <path d="M20.8 4.6a5.4 5.4 0 0 0-7.7 0L12 5.7l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L12 21l8.8-8.7a5.4 5.4 0 0 0 0-7.7Z" />
      ) : null}
      {name === "eye" ? (
        <>
          <path d="M2.1 12s3.7-6.5 9.9-6.5S21.9 12 21.9 12s-3.7 6.5-9.9 6.5S2.1 12 2.1 12Z" />
          <circle cx="12" cy="12" r="2.6" />
        </>
      ) : null}
      {name === "comment" ? <path d="M21 11.5a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z" /> : null}
      {name === "edit" ? (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </>
      ) : null}
      {name === "trash" ? (
        <>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v5m4-5v5" />
        </>
      ) : null}
      {name === "rocket" ? (
        <>
          <path d="M4.5 16.5 3 21l4.5-1.5" />
          <path d="M9 15 6 18" />
          <path d="M14 4.5c2.1-1.3 4.3-1.5 6.5-1-0.5 2.2-1.3 4.3-3 6.5L11 16.5 7.5 13Z" />
          <path d="M15 8.5h.01" />
        </>
      ) : null}
    </svg>
  );
}
