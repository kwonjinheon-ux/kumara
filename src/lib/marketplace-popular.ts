import type { PublicMarketPost } from "@/types/marketplace";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const COMMENT_WEIGHT = 18;

type PopularPostOptions = {
  excludeId?: string;
  limit?: number;
  now?: number;
};

export function getWeeklyPopularMarketPosts(
  posts: PublicMarketPost[],
  options: PopularPostOptions = {},
) {
  const now = options.now ?? Date.now();
  const weekStart = now - WEEK_MS;
  const candidates = posts.filter((post) => post.id !== options.excludeId);
  const weeklyPosts = candidates.filter((post) => new Date(post.createdAt).getTime() >= weekStart);
  const sourcePosts = weeklyPosts.length ? weeklyPosts : candidates;
  const sortedPosts = [...sourcePosts].sort(compareMarketPostPopularity);

  return typeof options.limit === "number" ? sortedPosts.slice(0, options.limit) : sortedPosts;
}

export function compareMarketPostPopularity(a: PublicMarketPost, b: PublicMarketPost) {
  const scoreDifference = getMarketPostPopularityScore(b) - getMarketPostPopularityScore(a);
  if (scoreDifference !== 0) return scoreDifference;

  const commentDifference = b.commentCount - a.commentCount;
  if (commentDifference !== 0) return commentDifference;

  const viewDifference = b.viewCount - a.viewCount;
  if (viewDifference !== 0) return viewDifference;

  return getSortTime(b) - getSortTime(a);
}

function getMarketPostPopularityScore(post: PublicMarketPost) {
  return post.commentCount * COMMENT_WEIGHT + post.viewCount;
}

function getSortTime(post: PublicMarketPost) {
  return new Date(post.bumpedAt ?? post.updatedAt ?? post.createdAt).getTime();
}
