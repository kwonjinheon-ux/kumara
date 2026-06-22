"use client";

import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { addFirebaseComment, deleteFirebaseComment, updateFirebaseComment } from "@/lib/firebase-marketplace";
import type { MarketComment, MarketVoteType } from "@/types/marketplace";

type Props = {
  currentUserId: string | null;
  currentUserNickname?: string | null;
  currentUserProfileImageUrl?: string | null;
  initialNow: number;
  initialComments: MarketComment[];
  isLoggedIn: boolean;
  postAuthorId: string | null;
  postId: string;
};

type RenderableMarketComment = MarketComment & {
  isOptimistic?: boolean;
};

function getCommentGoUpScore(comment: Pick<MarketComment, "upvoteCount" | "downvoteCount">) {
  return Math.max(0, (comment.upvoteCount ?? 0) - (comment.downvoteCount ?? 0));
}

export function MarketplaceComments({
  currentUserId,
  currentUserNickname,
  currentUserProfileImageUrl,
  initialNow,
  initialComments,
  isLoggedIn,
  postAuthorId,
  postId,
}: Props) {
  const { firebaseUser } = useAuth();
  const [comments, setComments] = useState<RenderableMarketComment[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    initialComments.forEach((comment) => {
      if (comment.parentId) {
        expanded.add(comment.parentId);
      }
    });
    return expanded;
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const sortedComments = useMemo(() => {
    const byParent = new Map<string, RenderableMarketComment[]>();
    const rootKey = "root";

    comments.forEach((comment) => {
      const key = comment.parentId ?? rootKey;
      byParent.set(key, [...(byParent.get(key) ?? []), comment]);
    });

    byParent.forEach((items, key) => {
      byParent.set(
        key,
        [...items].sort((a, b) => {
          const score = getCommentGoUpScore(b) - getCommentGoUpScore(a);
          return score || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }),
      );
    });

    return byParent;
  }, [comments]);

  async function submitComment(parentId: string | null, content: string) {
    if (!firebaseUser) {
      window.location.assign("/auth/login");
      return;
    }

    setMessage(null);
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    try {
      const savedPost = await addFirebaseComment({
        content: trimmedContent,
        currentUser: firebaseUser,
        parentId,
        postId,
      });
      if (savedPost) setComments(savedPost.comments);
      if (parentId) {
        setReplyDraft("");
        setReplyTo(null);
      } else {
        setDraft("");
      }
      return;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "댓글을 저장하지 못했습니다.");
      return;
    }

    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const parentComment = parentId ? comments.find((comment) => comment.id === parentId) : null;
    const optimisticComment: RenderableMarketComment = {
      authorNickname: currentUserNickname ?? "나",
      authorProfileImageUrl: currentUserProfileImageUrl ?? null,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
      depth: parentComment ? Math.min(3, (parentComment?.depth ?? 1) + 1) : 1,
      downvoteCount: 0,
      downvotedBy: [],
      id: optimisticId,
      isOptimistic: true,
      parentId,
      upvoteCount: 0,
      upvotedBy: [],
      userId: currentUserId ?? "current-user",
      userVote: null,
    };

    setComments((current) => [...current, optimisticComment]);
    if (parentId) {
      setExpandedThreads((current) => {
        const next = new Set(current);
        next.add(parentId as string);
        return next;
      });
      setReplyDraft("");
      setReplyTo(null);
    } else {
      setDraft("");
    }
    setOpenMenuId(null);
    setEditingCommentId(null);
    setEditDraft("");

    try {
      const response = await fetch(`/api/marketplace/posts/${postId}/comments`, {
        body: JSON.stringify({ content: trimmedContent, parentId }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setComments((current) => current.filter((comment) => comment.id !== optimisticId));
        if (parentId) {
          setReplyTo(parentId);
          setReplyDraft(trimmedContent);
        } else {
          setDraft(trimmedContent);
        }
        setMessage(result.error ?? "댓글을 저장하지 못했습니다.");
        return;
      }

      const serverComments = Array.isArray(result.post?.comments)
        ? (result.post.comments as MarketComment[])
        : [];

      if (serverComments.length) {
        setComments((current) => {
          const optimisticCommentInState = current.find((comment) => comment.id === optimisticId);
          const createdAt = optimisticCommentInState
            ? new Date(optimisticCommentInState.createdAt).getTime()
            : Date.now();
          const matchedServerComment = serverComments.find((comment) => {
            const sameAuthor = currentUserId ? comment.userId === currentUserId : true;
            const sameParent = comment.parentId === parentId;
            const sameContent = comment.content === trimmedContent;
            const closeEnough = Math.abs(new Date(comment.createdAt).getTime() - createdAt) < 60_000;

            return sameAuthor && sameParent && sameContent && closeEnough;
          });

          if (!matchedServerComment) {
            return serverComments;
          }

          const optimisticIds = new Set([optimisticId]);
          const serverIds = new Set(serverComments.map((comment) => comment.id));

          return current
            .filter((comment) => comment.id === optimisticId || serverIds.has(comment.id))
            .map((comment) => {
              if (comment.id !== optimisticId) {
                return serverComments.find((serverComment) => serverComment.id === comment.id) ?? comment;
              }

              return matchedServerComment;
            })
            .concat(
              serverComments.filter((comment) => {
                if (comment.id === matchedServerComment.id) {
                  return false;
                }

                return !optimisticIds.has(comment.id) && !current.some((localComment) => localComment.id === comment.id);
              }),
            );
        });
      }
    } catch {
      setComments((current) => current.filter((comment) => comment.id !== optimisticId));
      if (parentId) {
        setReplyTo(parentId);
        setReplyDraft(trimmedContent);
      } else {
        setDraft(trimmedContent);
      }
      setMessage("댓글을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  function submitCommentOnEnter(
    event: KeyboardEvent<HTMLTextAreaElement>,
    parentId: string | null,
    content: string,
  ) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    void submitComment(parentId, content);
  }

  async function voteComment(comment: RenderableMarketComment, vote: MarketVoteType) {
    if (!firebaseUser) {
      window.location.assign("/auth/login");
      return;
    }

    setMessage(null);

    const response = await fetch(`/api/marketplace/posts/${postId}/comments/${comment.id}/vote`, {
      body: JSON.stringify({ vote: comment.userVote === vote ? null : vote }),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "댓글 추천을 변경하지 못했습니다.");
      return;
    }

    setComments(result.post.comments);
  }

  function startCommentEdit(comment: RenderableMarketComment) {
    setEditingCommentId(comment.id);
    setEditDraft(comment.content);
    setReplyTo(null);
    setOpenMenuId(null);
  }

  async function submitCommentEdit(commentId: string) {
    if (!firebaseUser) {
      window.location.assign("/auth/login");
      return;
    }

    setMessage(null);
    try {
      const savedPost = await updateFirebaseComment(postId, commentId, firebaseUser, editDraft);
      if (savedPost) setComments(savedPost.comments);
      setEditingCommentId(null);
      setEditDraft("");
      setOpenMenuId(null);
      return;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "댓글을 삭제하지 못했습니다.");
      return;
    }

    const response = await fetch(`/api/marketplace/posts/${postId}/comments/${commentId}`, {
      body: JSON.stringify({ content: editDraft }),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "댓글을 수정하지 못했습니다.");
      return;
    }

    setComments(result.post.comments);
    setEditingCommentId(null);
    setEditDraft("");
    setOpenMenuId(null);
  }

  async function deleteComment(commentId: string) {
    if (!firebaseUser) {
      window.location.assign("/auth/login");
      return;
    }

    if (!window.confirm("댓글을 삭제할까요?")) return;

    setMessage(null);
    try {
      const savedPost = await deleteFirebaseComment(postId, commentId, firebaseUser);
      if (savedPost) setComments(savedPost.comments);
      setEditingCommentId(null);
      setEditDraft("");
      setOpenMenuId(null);
      return;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "댓글을 삭제하지 못했습니다.");
      return;
    }

    const response = await fetch(`/api/marketplace/posts/${postId}/comments/${commentId}`, {
      credentials: "same-origin",
      method: "DELETE",
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "댓글을 삭제하지 못했습니다.");
      return;
    }

    setComments(result.post.comments);
    setEditingCommentId(null);
    setEditDraft("");
    setOpenMenuId(null);
  }

  function toggleThread(commentId: string) {
    setExpandedThreads((current) => {
      const next = new Set(current);

      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }

      return next;
    });
  }

  function renderComments(parentId: string | null, depth = 1) {
    const items = sortedComments.get(parentId ?? "root") ?? [];

    return items.map((comment) => {
      const score = getCommentGoUpScore(comment);
      const childCount = sortedComments.get(comment.id)?.length ?? 0;
      const hasChildren = childCount > 0;
      const isExpanded = expandedThreads.has(comment.id);
      const hasVisibleChildren = hasChildren && isExpanded;
      const isOptimistic = Boolean(comment.isOptimistic);
      const canManage = currentUserId === comment.userId && !isOptimistic;
      const isPostAuthor = Boolean(postAuthorId) && comment.userId === postAuthorId;

      return (
        <article
          className="market-comment"
          data-depth={depth}
          data-expanded={isExpanded}
          data-has-children={hasChildren}
          data-optimistic={isOptimistic}
          key={comment.id}
        >
          <div className="market-comment__avatar">
            {comment.authorProfileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={comment.authorProfileImageUrl} />
            ) : (
              <span>{comment.authorNickname.slice(0, 1)}</span>
            )}
          </div>
          <div className="market-comment__body">
            <header className="market-comment__header">
              <span className="market-comment__meta">
                {isPostAuthor ? <span className="market-comment-author-badge">작성자</span> : null}
                <strong>@{comment.authorNickname}</strong>
                <span aria-hidden="true">•</span>
                <time dateTime={comment.createdAt} suppressHydrationWarning>
                  {formatRelativeTime(comment.createdAt, initialNow)}
                </time>
              </span>
              {canManage ? (
                <div className="market-comment__menu">
                  <button
                    aria-expanded={openMenuId === comment.id}
                    aria-label="댓글 관리"
                    className="market-comment__menu-button"
                    onClick={() => setOpenMenuId((current) => (current === comment.id ? null : comment.id))}
                    type="button"
                  >
                    <span aria-hidden="true">⋮</span>
                  </button>
                  {openMenuId === comment.id ? (
                    <div className="market-comment__menu-panel" role="menu">
                      <button onClick={() => startCommentEdit(comment)} role="menuitem" type="button">
                        수정
                      </button>
                      <button onClick={() => void deleteComment(comment.id)} role="menuitem" type="button">
                        삭제
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </header>
            {editingCommentId === comment.id ? (
              <form
                className="market-comment-edit-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitCommentEdit(comment.id);
                }}
              >
                <textarea
                  aria-label="댓글 수정"
                  onChange={(event) => setEditDraft(event.target.value)}
                  required
                  rows={3}
                  value={editDraft}
                />
                <div>
                  <button type="submit">수정 저장</button>
                  <button
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditDraft("");
                    }}
                    type="button"
                  >
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <p>{comment.content}</p>
            )}
            <footer>
              <button
                aria-label="댓글 추천"
                className={comment.userVote === "up" ? "active" : ""}
                disabled={isOptimistic}
                onClick={() => void voteComment(comment, "up")}
                type="button"
              >
                <CommentActionIcon name="up" />
              </button>
              <strong>{score}</strong>
              <button
                aria-label="댓글 비추천"
                className={comment.userVote === "down" ? "active" : ""}
                disabled={isOptimistic}
                onClick={() => void voteComment(comment, "down")}
                type="button"
              >
                <CommentActionIcon name="down" />
              </button>
              {depth < 3 ? (
                <button
                  className="market-comment__reply-button"
                  aria-label="답글"
                  disabled={isOptimistic}
                  onClick={() => {
                    setReplyTo(comment.id);
                    setEditingCommentId(null);
                    setOpenMenuId(null);
                  }}
                  type="button"
                >
                  <span>답글</span>
                </button>
              ) : null}
            </footer>
            {replyTo === comment.id ? (
              <form
                className="market-comment-form compact"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitComment(comment.id, replyDraft);
                }}
              >
                <textarea
                  aria-label="답글 입력"
                  onChange={(event) => setReplyDraft(event.target.value)}
                  onKeyDown={(event) => submitCommentOnEnter(event, comment.id, replyDraft)}
                  placeholder="답글을 입력하세요"
                  required
                  rows={2}
                  value={replyDraft}
                />
                <div>
                  <button type="submit">답글 등록</button>
                </div>
              </form>
            ) : null}
            {hasVisibleChildren ? <div className="market-comment__children">{renderComments(comment.id, depth + 1)}</div> : null}
            {childCount > 0 ? (
              <button
                aria-expanded={isExpanded}
                className="market-comment-thread-toggle"
                onClick={() => toggleThread(comment.id)}
                type="button"
              >
                <span>{isExpanded ? "답글 숨기기" : `댓글 ${childCount}개`}</span>
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            ) : null}
          </div>
        </article>
      );
    });
  }

  return (
    <section className="market-comments" aria-label="댓글">
      <form
        className="market-comment-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submitComment(null, draft);
        }}
      >
        <div className="market-comment-input-shell">
          <textarea
            aria-label="댓글 입력"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => submitCommentOnEnter(event, null, draft)}
            placeholder={comments.length ? "" : "아직 댓글이 없습니다."}
            required
            rows={2}
            value={draft}
          />
          <button type="submit">등록</button>
        </div>
        {message ? <p className="form-error">{message}</p> : null}
      </form>
      <div className="market-comment-list">
        {comments.length ? renderComments(null) : null}
      </div>
    </section>
  );
}

function CommentActionIcon({ name }: { name: "down" | "reply" | "up" }) {
  if (name === "up" || name === "down") {
    const arrowPath =
      name === "up"
        ? "M12 4.8 5.45 11.35h3.95v7.85h5.2v-7.85h3.95L12 4.8Z"
        : "M12 19.2 18.55 12.65H14.6V4.8H9.4v7.85H5.45L12 19.2Z";

    return (
      <svg
        aria-hidden
        className="market-comment-action-icon market-comment-action-icon--arrow"
        focusable={false}
        viewBox="0 0 24 24"
      >
        <path d={arrowPath} fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.1" />
      </svg>
    );
  }

  const commonProps = {
    "aria-hidden": true,
    className: "market-comment-action-icon",
    fill: "none",
    focusable: false,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  return (
    <svg {...commonProps}>
      {name === "reply" ? <path d="M21 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 3v-8.5A7.5 7.5 0 0 1 10.5 6h3" /> : null}
    </svg>
  );
}

function formatRelativeTime(value: string, now = Date.now()) {
  const diff = now - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "방금 전";
  if (diff < hour) return `${Math.floor(diff / minute)}분 전`;
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`;
  if (diff < day * 2) return "어제";
  if (diff < day * 7) return `${Math.floor(diff / day)}일 전`;

  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}
