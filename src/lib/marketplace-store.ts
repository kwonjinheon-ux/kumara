import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import {
  hamiltonSuburbs,
  marketBoardTypes,
  getMarketplaceImageLimit,
  marketItemConditions,
  marketItemCategories,
  marketRegions,
  marketStatuses,
  marketTradeMethods,
} from "@/config/marketplace";
import { getAllKeywordAlertSettings } from "@/lib/keyword-alert-store";
import { createNotification } from "@/lib/notification-store";
import { findUserById } from "@/lib/user-store";
import type { PublicUser } from "@/types/user";
import type {
  MarketBoardType,
  MarketContactDisplay,
  MarketContactMethod,
  MarketItemCondition,
  MarketItemCategory,
  MarketComment,
  MarketPostImage,
  MarketPriceType,
  MarketPurchaseRequest,
  MarketPurchaseRequestStatus,
  MarketStatus,
  MarketTradeMethod,
  MarketVoteType,
  PublicMarketPost,
  StoredMarketPost,
} from "@/types/marketplace";
import type { ManagedUserComment } from "@/types/user-comment";

const dataFile = path.join(process.cwd(), "data", "market-posts.json");
const postDirectory = path.join(process.cwd(), "data", "market-posts");
let cachedPosts: StoredMarketPost[] | null = null;
let cachedPostsMtimeMs = 0;
let cachedPostsDirty = false;
let cachedSortedPosts: StoredMarketPost[] | null = null;
let cachedPostMap: Map<string, StoredMarketPost> | null = null;
const cachedPostLists = new Map<string, PublicMarketPost[]>();
let pendingPersist: NodeJS.Timeout | null = null;
let persistQueue: Promise<void> = Promise.resolve();

const seedPosts: StoredMarketPost[] = [
  {
    id: "seed-iphone-13-hamilton",
    userId: null,
    authorNickname: "KiwiSeller",
    authorProfileImageUrl: null,
    boardType: "개인판매",
    itemCategory: "전자기기",
    title: "아이폰 13 128GB 판매합니다",
    content: "상태 좋은 아이폰 13입니다. Hamilton에서 거래 가능합니다.",
    contentHtml: "<p>상태 좋은 아이폰 13입니다. Hamilton에서 거래 가능합니다.</p>",
    priceType: "amount",
    priceAmount: 450,
    region: "Hamilton",
    tradeMethod: "직거래",
    itemCondition: "상태 좋음",
    contactMethod: "korin_chat",
    contactValue: null,
    status: "판매중",
    thumbnailDataUrl: null,
    images: [],
    coverImageId: null,
    viewCount: 134,
    commentCount: 5,
    upvoteCount: 18,
    downvoteCount: 1,
    bookmarkCount: 8,
    bookmarkedBy: [],
    bookmarkedAtBy: {},
    purchaseRequests: [],
    selectedBuyerId: null,
    pointAwardedAt: null,
    upvotedBy: [],
    downvotedBy: [],
    comments: [],
    isBoosted: true,
    bumpedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "seed-ikea-desk-auckland",
    userId: null,
    authorNickname: "SeoulNZ",
    authorProfileImageUrl: null,
    boardType: "개인판매",
    itemCategory: "가구 / 인테리어",
    title: "IKEA 책상과 의자 세트",
    content: "Auckland 픽업 가능한 책상과 의자 세트입니다.",
    contentHtml: "<p>Auckland 픽업 가능한 책상과 의자 세트입니다.</p>",
    priceType: "amount",
    priceAmount: 120,
    region: "Auckland",
    tradeMethod: "픽업만",
    itemCondition: "사용감 있음",
    contactMethod: "korin_chat",
    contactValue: null,
    status: "거래중",
    thumbnailDataUrl: null,
    images: [],
    coverImageId: null,
    viewCount: 98,
    commentCount: 3,
    upvoteCount: 12,
    downvoteCount: 0,
    bookmarkCount: 4,
    bookmarkedBy: [],
    bookmarkedAtBy: {},
    purchaseRequests: [],
    selectedBuyerId: null,
    pointAwardedAt: null,
    upvotedBy: [],
    downvotedBy: [],
    comments: [],
    isBoosted: false,
    bumpedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "seed-stroller-free",
    userId: null,
    authorNickname: "HamiltonMom",
    authorProfileImageUrl: null,
    boardType: "무료나눔",
    itemCategory: "유아 / 아동용품",
    title: "유모차 무료나눔 합니다",
    content: "사용감은 있지만 아직 튼튼합니다.",
    contentHtml: "<p>사용감은 있지만 아직 튼튼합니다.</p>",
    priceType: "free",
    priceAmount: null,
    region: "Hamilton",
    tradeMethod: "픽업만",
    itemCondition: "사용감 있음",
    contactMethod: "korin_chat",
    contactValue: null,
    status: "판매중",
    thumbnailDataUrl: null,
    images: [],
    coverImageId: null,
    viewCount: 241,
    commentCount: 11,
    upvoteCount: 34,
    downvoteCount: 2,
    bookmarkCount: 15,
    bookmarkedBy: [],
    bookmarkedAtBy: {},
    purchaseRequests: [],
    selectedBuyerId: null,
    pointAwardedAt: null,
    upvotedBy: [],
    downvotedBy: [],
    comments: [],
    isBoosted: false,
    bumpedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

async function ensureStore() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.mkdir(postDirectory, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, `${JSON.stringify(seedPosts, null, 2)}\n`, "utf8");
  }
}

function getPostFile(postId: string) {
  return path.join(postDirectory, `${postId}.json`);
}

async function writeSinglePost(post: StoredMarketPost) {
  await ensureStore();
  await writeJsonFileAtomic(getPostFile(post.id), `${JSON.stringify(post)}\n`);
}

async function readSinglePost(postId: string) {
  try {
    const raw = await fs.readFile(getPostFile(postId), "utf8");
    return normalizeStoredPost(JSON.parse(raw) as StoredMarketPost);
  } catch {
    return null;
  }
}

async function readPosts(options: { force?: boolean } = {}): Promise<StoredMarketPost[]> {
  await ensureStore();

  if (!options.force && cachedPostsDirty && cachedPosts) {
    return cachedPosts;
  }

  const stats = await fs.stat(dataFile);

  if (!options.force && cachedPosts && (cachedPostsDirty || cachedPostsMtimeMs === stats.mtimeMs)) {
    return cachedPosts;
  }

  let parsed: StoredMarketPost[];

  try {
    const raw = await fs.readFile(dataFile, "utf8");
    parsed = JSON.parse(raw) as StoredMarketPost[];
  } catch (error) {
    console.error("Failed to parse marketplace data file. Falling back to per-post files.", error);
    parsed = await readPostFiles();
  }

  const normalizedPosts = parsed.map(normalizeStoredPost);
  const normalizedPostIds = new Set(normalizedPosts.map((post) => post.id));
  const missingFilePosts = (await readPostFiles()).filter((post) => !normalizedPostIds.has(post.id));
  const posts = missingFilePosts.length
    ? [...missingFilePosts, ...normalizedPosts].sort((a, b) => getSortDate(b).localeCompare(getSortDate(a)))
    : normalizedPosts;

  setCachedPosts(posts, false);
  cachedPostsMtimeMs = stats.mtimeMs;

  if (missingFilePosts.length) {
    await writePosts(posts);
  }

  return posts;
}

function setCachedPosts(posts: StoredMarketPost[], dirty: boolean) {
  cachedPosts = posts;
  cachedPostsDirty = dirty;
  cachedSortedPosts = null;
  cachedPostMap = null;
  cachedPostLists.clear();
}

function getPostMap(posts: StoredMarketPost[]) {
  if (!cachedPostMap || cachedPosts !== posts) {
    cachedPostMap = new Map(posts.map((post) => [post.id, post]));
  }

  return cachedPostMap;
}

function getSortedPosts(posts: StoredMarketPost[]) {
  if (!cachedSortedPosts || cachedPosts !== posts) {
    cachedSortedPosts = [...posts].sort((a, b) => getSortDate(b).localeCompare(getSortDate(a)));
  }

  return cachedSortedPosts;
}

type WritePostOptions = {
  defer?: boolean;
};

type MarketPostWriteInput = {
  boardType: unknown;
  itemCategory: unknown;
  title: unknown;
  content: unknown;
  priceType: unknown;
  priceAmount: unknown;
  region: unknown;
  tradeMethod?: unknown;
  itemCondition?: unknown;
  contactMethod?: unknown;
  contactMethods?: unknown;
  contactPhoneNumber?: unknown;
  contactKakaoTalkId?: unknown;
  thumbnailDataUrl: unknown;
  contentHtml?: unknown;
  images?: unknown;
  coverImageId?: unknown;
};

function queuePersistPosts(posts: StoredMarketPost[]) {
  const payload = `${JSON.stringify(posts)}\n`;
  persistQueue = persistQueue
    .catch(() => undefined)
    .then(async () => {
      await ensureStore();
      await writeJsonFileAtomic(dataFile, payload);
      const stats = await fs.stat(dataFile);
      cachedPostsMtimeMs = stats.mtimeMs;
      cachedPostsDirty = false;
    });

  return persistQueue;
}

async function writeJsonFileAtomic(filePath: string, payload: string) {
  const tempFile = `${filePath}.${randomUUID()}.tmp`;

  try {
    await fs.writeFile(tempFile, payload, "utf8");
    await replaceFileWithRetry(tempFile, filePath, payload);
  } catch (error) {
    await fs.unlink(tempFile).catch(() => undefined);
    throw error;
  }
}

async function replaceFileWithRetry(tempFile: string, filePath: string, payload: string) {
  const maxAttempts = 10;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await fs.rename(tempFile, filePath);
      return;
    } catch (error) {
      lastError = error;
      if (!isTransientFileLockError(error) || attempt === maxAttempts) break;
      await delay(getFileRetryDelay(attempt));
    }
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await fs.copyFile(tempFile, filePath);
      await fs.unlink(tempFile).catch(() => undefined);
      return;
    } catch (error) {
      lastError = error;
      if (!isTransientFileLockError(error) || attempt === maxAttempts) break;
      await delay(getFileRetryDelay(attempt));
    }
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await fs.writeFile(filePath, payload, "utf8");
      await fs.unlink(tempFile).catch(() => undefined);
      return;
    } catch (error) {
      lastError = error;
      if (!isTransientFileLockError(error) || attempt === maxAttempts) break;
      await delay(getFileRetryDelay(attempt));
    }
  }

  throw lastError;
}

function isTransientFileLockError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const errno = "errno" in error ? Number(error.errno) : null;
  return code === "EPERM" || code === "EACCES" || code === "EBUSY" || code === "UNKNOWN" || errno === -4094;
}

function getFileRetryDelay(attempt: number) {
  return 75 * attempt;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readPostFiles() {
  await ensureStore();

  const files = await fs.readdir(postDirectory).catch(() => []);
  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        try {
          const raw = await fs.readFile(path.join(postDirectory, file), "utf8");
          return normalizeStoredPost(JSON.parse(raw) as StoredMarketPost);
        } catch (error) {
          console.error(`Failed to read marketplace post file ${file}.`, error);
          return null;
        }
      }),
  );

  return posts
    .filter((post): post is StoredMarketPost => Boolean(post))
    .sort((a, b) => getSortDate(b).localeCompare(getSortDate(a)));
}

async function writePosts(posts: StoredMarketPost[], options: WritePostOptions = {}) {
  await ensureStore();
  setCachedPosts(posts, true);
  if (pendingPersist) clearTimeout(pendingPersist);
  pendingPersist = null;

  if (options.defer) {
    pendingPersist = setTimeout(() => {
      pendingPersist = null;
      void queuePersistPosts(posts).catch((error) => {
        console.error("Failed to persist marketplace posts.", error);
      });
    }, 1200);
    return;
  }

  await queuePersistPosts(posts);
}

export async function getMarketPosts(currentUserId?: string | null) {
  const posts = await readPosts();

  return getSortedPosts(posts)
    .map((post) => toPublicMarketPost(post, currentUserId))
}

export async function getMarketPostList(currentUserId?: string | null) {
  const posts = await readPosts();
  const cacheKey = currentUserId ?? "";
  const cachedList = cachedPostLists.get(cacheKey);

  if (cachedList) {
    return cachedList;
  }

  const list = getSortedPosts(posts).map((post) => toMarketPostListItem(post, currentUserId));
  cachedPostLists.set(cacheKey, list);

  return list;
}

export async function getMarketPostImageData(
  postId: string,
  imageId: string,
  variant: "full" | "thumb" = "full",
) {
  const posts = await readPosts();
  const post = getPostMap(posts).get(postId);

  if (!post) return null;

  if (imageId === "author") {
    return post.authorProfileImageUrl;
  }

  if (imageId === "thumbnail") {
    return post.thumbnailDataUrl;
  }

  if (imageId.startsWith("content-")) {
    const index = Number(imageId.slice("content-".length));
    return Number.isInteger(index) ? extractContentImageDataUrls(post.contentHtml)[index] ?? null : null;
  }

  if (imageId.startsWith("comment-author-")) {
    const commentId = imageId.slice("comment-author-".length);
    return post.comments.find((comment) => comment.id === commentId)?.authorProfileImageUrl ?? null;
  }

  const image = post.images.find((item) => item.id === imageId);
  if (!image) return null;

  return variant === "thumb" ? image.thumbnailDataUrl ?? image.dataUrl : image.dataUrl;
}

export async function getUserMarketplaceComments(userId: string): Promise<ManagedUserComment[]> {
  const posts = await readPosts();

  return posts
    .flatMap((post) =>
      post.comments
        .filter((comment) => comment.userId === userId)
        .map((comment) => ({
          id: `marketplace:${post.id}:${comment.id}`,
          userId,
          category: "마켓플레이스" as const,
          body: comment.content,
          sourceTitle: post.title,
          sourceHref: `/marketplace/${post.id}`,
          createdAt: comment.createdAt,
        })),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteUserMarketplaceComments(userId: string, ids: string[]) {
  const refs = ids
    .map((id) => {
      const [source, postId, commentId] = id.split(":");

      if (source !== "marketplace" || !postId || !commentId) return null;

      return { commentId, managedId: id, postId };
    })
    .filter((ref): ref is { commentId: string; managedId: string; postId: string } => Boolean(ref));

  if (!refs.length) return [];

  const posts = await readPosts();
  const deletedIds = new Set<string>();
  let hasChanges = false;

  for (const post of posts) {
    const postRefs = refs.filter((ref) => ref.postId === post.id);
    if (!postRefs.length) continue;

    const ownedTargetIds = new Set(
      postRefs
        .filter((ref) => post.comments.some((comment) => comment.id === ref.commentId && comment.userId === userId))
        .map((ref) => ref.commentId),
    );

    if (!ownedTargetIds.size) continue;

    const idsToRemove = new Set(ownedTargetIds);
    let expanded = true;

    while (expanded) {
      expanded = false;

      for (const comment of post.comments) {
        if (comment.parentId && idsToRemove.has(comment.parentId) && !idsToRemove.has(comment.id)) {
          idsToRemove.add(comment.id);
          expanded = true;
        }
      }
    }

    const beforeCount = post.comments.length;
    post.comments = post.comments.filter((comment) => !idsToRemove.has(comment.id));
    post.commentCount = post.comments.length;

    if (post.comments.length !== beforeCount) {
      hasChanges = true;
      post.updatedAt = new Date().toISOString();
      postRefs
        .filter((ref) => ownedTargetIds.has(ref.commentId))
        .forEach((ref) => deletedIds.add(ref.managedId));
    }
  }

  if (hasChanges) {
    await writePosts(posts);
  }

  return [...deletedIds];
}

export async function createMarketPost(
  user: PublicUser,
  input: MarketPostWriteInput,
) {
  const posts = await readPosts();
  const now = new Date().toISOString();
  const priceType = normalizePriceType(input.priceType);
  const images = normalizeImages(input.images, now);
  const imageLimit = getMarketplaceImageLimit(user.membershipLevel);
  if (images.length > imageLimit) {
    throw new Error(`현재 등급에서는 이미지를 최대 ${imageLimit}장까지 넣을 수 있습니다.`);
  }
  const coverImageId = normalizeCoverImageId(input.coverImageId, images);
  const coverImage = getCoverImage(images, coverImageId);
  const fallbackContent = normalizeText(input.content, 4000, "본문을 입력해 주세요.");
  const contentHtml = normalizeHtml(input.contentHtml, fallbackContent);
  const thumbnailDataUrl = normalizeThumbnail(input.thumbnailDataUrl);
  const contentImageUrl = getFirstContentImageUrl(contentHtml);
  const contact = normalizeContactForPost(user, input);
  const post: StoredMarketPost = {
    id: randomUUID(),
    userId: user.id,
    authorNickname: user.nickname,
    authorProfileImageUrl: user.profile.profileImageUrl,
    boardType: normalizeBoardType(input.boardType),
    itemCategory: normalizeItemCategory(input.itemCategory),
    title: normalizeText(input.title, 80, "제목을 입력해 주세요."),
    content: fallbackContent,
    contentHtml,
    priceType,
    priceAmount: priceType === "amount" ? normalizePriceAmount(input.priceAmount) : null,
    region: normalizeRegion(input.region),
    tradeMethod: normalizeTradeMethod(input.tradeMethod),
    itemCondition: normalizeItemCondition(input.itemCondition),
    contactMethod: contact.method,
    contactValue: contact.value,
    contactMethods: contact.methods,
    contactValues: contact.values,
    status: "판매중",
    thumbnailDataUrl: getThumbnailFromImage(coverImage) ?? thumbnailDataUrl ?? contentImageUrl,
    images,
    coverImageId,
    viewCount: 0,
    commentCount: 0,
    upvoteCount: 0,
    downvoteCount: 0,
    bookmarkCount: 0,
    bookmarkedBy: [],
    bookmarkedAtBy: {},
    purchaseRequests: [],
    selectedBuyerId: null,
    pointAwardedAt: null,
    upvotedBy: [],
    downvotedBy: [],
    comments: [],
    isBoosted: false,
    bumpedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  posts.unshift(post);
  setCachedPosts(posts, true);
  await writeSinglePost(post);
  await writePosts(posts);
  void notifyKeywordMatches(post, user.id).catch((error) => {
    console.error("Failed to send marketplace keyword notifications.", error);
  });

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

export async function updateMarketPostStatus(
  postId: string,
  user: PublicUser,
  rawStatus: unknown,
) {
  const posts = await readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) {
    throw new Error("게시글을 찾을 수 없습니다.");
  }

  if (post.userId !== user.id && !["admin", "super_admin", "moderator"].includes(user.role)) {
    throw new Error("본인 게시글만 상태를 변경할 수 있습니다.");
  }

  if (post.status === "판매완료") {
    throw new Error("판매완료된 글은 판매 상태를 다시 변경할 수 없습니다.");
  }

  const nextStatus = normalizeStatus(rawStatus);
  if (nextStatus === "판매완료") {
    throw new Error("판매완료는 구매자 확인과 판매자 최종 확인 후 처리됩니다.");
  }

  post.status = nextStatus;
  post.updatedAt = new Date().toISOString();
  await writePosts(posts);

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

export async function requestMarketPurchase(postId: string, user: PublicUser) {
  const posts = await readPosts();
  const post = getPostForTradeAction(posts, postId);

  if (post.userId === user.id) {
    throw new Error("본인 게시글에는 구매 요청을 할 수 없습니다.");
  }

  if (post.status === "판매완료") {
    throw new Error("이미 판매완료된 글입니다.");
  }

  const existing = post.purchaseRequests.find((request) => request.buyerId === user.id);
  if (existing) {
    return toPublicMarketPost(post, user.id, user.membershipLevel);
  }

  const now = new Date().toISOString();
  post.purchaseRequests.push({
    id: randomUUID(),
    buyerId: user.id,
    buyerNickname: user.nickname,
    status: "requested",
    requestedAt: now,
    selectedAt: null,
    buyerConfirmedAt: null,
    sellerConfirmedAt: null,
  });
  post.updatedAt = now;
  await writePosts(posts);
  void createTradeNotification({
    userId: post.userId,
    title: "새 구매 요청",
    message: `${user.nickname}님이 "${post.title}" 글에 구매 요청을 보냈습니다.`,
    postId: post.id,
  });

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

export async function selectMarketPurchaseBuyer(postId: string, user: PublicUser, buyerId: unknown) {
  const posts = await readPosts();
  const post = getPostForTradeAction(posts, postId);
  ensurePostOwner(post, user);

  if (post.status === "판매완료") {
    throw new Error("이미 판매완료된 글입니다.");
  }

  const normalizedBuyerId = String(buyerId ?? "").trim();
  const selectedRequest = post.purchaseRequests.find((request) => request.buyerId === normalizedBuyerId);
  if (!selectedRequest) {
    throw new Error("선택할 구매 요청을 찾을 수 없습니다.");
  }

  const now = new Date().toISOString();
  post.selectedBuyerId = selectedRequest.buyerId;
  post.status = "거래완료 대기";
  post.purchaseRequests = post.purchaseRequests.map((request) => ({
    ...request,
    status: request.buyerId === selectedRequest.buyerId ? "selected" : "requested",
    selectedAt: request.buyerId === selectedRequest.buyerId ? now : null,
    buyerConfirmedAt: request.buyerId === selectedRequest.buyerId ? request.buyerConfirmedAt : null,
    sellerConfirmedAt: request.buyerId === selectedRequest.buyerId ? request.sellerConfirmedAt : null,
  }));
  post.updatedAt = now;
  await writePosts(posts);
  void createTradeNotification({
    userId: selectedRequest.buyerId,
    title: "구매자로 선택됨",
    message: `"${post.title}" 거래 구매자로 선택되었습니다. 거래 완료 후 확인을 눌러 주세요.`,
    postId: post.id,
  });

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

export async function confirmMarketPurchaseByBuyer(postId: string, user: PublicUser) {
  const posts = await readPosts();
  const post = getPostForTradeAction(posts, postId);
  const request = post.purchaseRequests.find((item) => item.buyerId === user.id && item.buyerId === post.selectedBuyerId);

  if (!request) {
    throw new Error("거래 완료 확인 대상이 아닙니다.");
  }

  if (post.status !== "거래완료 대기") {
    throw new Error("거래완료 대기 상태에서만 확인할 수 있습니다.");
  }

  const now = new Date().toISOString();
  request.status = "buyer_confirmed";
  request.buyerConfirmedAt = now;
  post.updatedAt = now;
  await writePosts(posts);
  void createTradeNotification({
    userId: post.userId,
    title: "구매자 거래 완료 확인",
    message: `${request.buyerNickname}님이 "${post.title}" 거래 완료를 확인했습니다. 최종 확인을 진행해 주세요.`,
    postId: post.id,
  });

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

export async function confirmMarketPurchaseBySeller(postId: string, user: PublicUser) {
  const posts = await readPosts();
  const post = getPostForTradeAction(posts, postId);
  ensurePostOwner(post, user);

  const request = post.purchaseRequests.find((item) => item.buyerId === post.selectedBuyerId);
  if (!request || request.status !== "buyer_confirmed") {
    throw new Error("구매자의 거래 완료 확인이 먼저 필요합니다.");
  }

  const now = new Date().toISOString();
  request.status = "seller_confirmed";
  request.sellerConfirmedAt = now;
  post.status = "판매완료";
  post.pointAwardedAt = now;
  post.updatedAt = now;
  await writePosts(posts);
  void createTradeNotification({
    userId: request.buyerId,
    title: "거래 완료",
    message: `"${post.title}" 거래가 판매완료 처리되었습니다. 포인트 지급 기록이 남았습니다.`,
    postId: post.id,
  });

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

export async function updateMarketPost(
  postId: string,
  user: PublicUser,
  input: MarketPostWriteInput,
) {
  const posts = await readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) {
    throw new Error("게시글을 찾을 수 없습니다.");
  }

  if (post.userId !== user.id && !["admin", "super_admin", "moderator"].includes(user.role)) {
    throw new Error("본인 게시글만 수정할 수 있습니다.");
  }

  if (post.status === "판매완료") {
    throw new Error("판매완료된 글은 수정할 수 없습니다.");
  }

  const now = new Date().toISOString();
  const priceType = normalizePriceType(input.priceType);
  const images = normalizeImages(input.images, now);
  const imageLimit = getMarketplaceImageLimit(user.membershipLevel);
  if (images.length > imageLimit) {
    throw new Error(`현재 등급에서는 이미지를 최대 ${imageLimit}장까지 넣을 수 있습니다.`);
  }

  const coverImageId = normalizeCoverImageId(input.coverImageId, images);
  const coverImage = getCoverImage(images, coverImageId);
  const fallbackContent = normalizeText(input.content, 4000, "본문을 입력해 주세요.");
  const contentHtml = normalizeHtml(input.contentHtml, fallbackContent);
  const thumbnailDataUrl = normalizeThumbnail(input.thumbnailDataUrl);
  const contentImageUrl = getFirstContentImageUrl(contentHtml);
  const contact = normalizeContactForPost(user, input);

  post.boardType = normalizeBoardType(input.boardType);
  post.itemCategory = normalizeItemCategory(input.itemCategory);
  post.title = normalizeText(input.title, 80, "제목을 입력해 주세요.");
  post.content = fallbackContent;
  post.contentHtml = contentHtml;
  post.priceType = priceType;
  post.priceAmount = priceType === "amount" ? normalizePriceAmount(input.priceAmount) : null;
  post.region = normalizeRegion(input.region);
  post.tradeMethod = normalizeTradeMethod(input.tradeMethod);
  post.itemCondition = normalizeItemCondition(input.itemCondition);
  post.contactMethod = contact.method;
  post.contactValue = contact.value;
  post.contactMethods = contact.methods;
  post.contactValues = contact.values;
  post.thumbnailDataUrl = getThumbnailFromImage(coverImage) ?? thumbnailDataUrl ?? contentImageUrl;
  post.images = images;
  post.coverImageId = coverImageId;
  post.updatedAt = now;

  setCachedPosts(posts, true);
  await writeSinglePost(post);
  await writePosts(posts, { defer: true });

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

export async function deleteMarketPost(postId: string, user: PublicUser) {
  const posts = await readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) {
    throw new Error("게시글을 찾을 수 없습니다.");
  }

  if (post.userId !== user.id && !["admin", "super_admin", "moderator"].includes(user.role)) {
    throw new Error("본인 게시글만 삭제할 수 있습니다.");
  }

  await writePosts(posts.filter((item) => item.id !== postId));
}

export async function toggleMarketPostBookmark(postId: string, user: PublicUser) {
  const posts = await readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) throw new Error("게시글을 찾을 수 없습니다.");

  const isBookmarked = post.bookmarkedBy.includes(user.id);
  post.bookmarkedBy = toggleArrayValue(post.bookmarkedBy, user.id);

  if (isBookmarked) {
    delete post.bookmarkedAtBy[user.id];
  } else {
    post.bookmarkedAtBy[user.id] = new Date().toISOString();
    await notifyPostBookmark(post, user);
  }

  post.bookmarkCount = post.bookmarkedBy.length;
  post.updatedAt = new Date().toISOString();
  await writePosts(posts);

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

async function notifyPostBookmark(post: StoredMarketPost, user: PublicUser) {
  if (!post.userId || post.userId === user.id) return;

  const author = await findUserById(post.userId);

  if (!author?.profile.notificationSavedPosts) return;

  await createNotification({
    userId: post.userId,
    type: "bookmark",
    title: "새 북마크",
    message: `${user.nickname}님이 "${post.title}" 글을 찜했습니다.`,
    targetType: "marketplace",
    targetId: post.id,
  });
}

async function createTradeNotification(input: {
  userId: string | null;
  title: string;
  message: string;
  postId: string;
}) {
  if (!input.userId) return;

  try {
    await createNotification({
      userId: input.userId,
      type: "trade",
      title: input.title,
      message: input.message,
      targetType: "marketplace",
      targetId: input.postId,
    });
  } catch {
    // 거래 상태 저장은 알림 저장 실패와 분리해서 유지합니다.
  }
}

async function notifyKeywordMatches(post: StoredMarketPost, authorId: string) {
  const settings = await getAllKeywordAlertSettings();
  const marketplaceLabels = ["마켓플레이스", "중고거래", post.boardType, post.itemCategory];
  const haystack = [
    post.title,
    post.content,
    post.boardType,
    post.itemCategory,
    post.region,
    post.tradeMethod,
    post.itemCondition,
  ].join(" ").toLowerCase();

  await Promise.all(
    settings
      .filter((setting) => {
        if (!setting.isActive || !setting.notifyInApp || setting.userId === authorId || !setting.keywords.length) {
          return false;
        }

        const matchesScope = !setting.categoryScope.length ||
          setting.categoryScope.some((scope) => marketplaceLabels.includes(scope));
        const matchesKeyword = setting.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));

        return matchesScope && matchesKeyword;
      })
      .map((setting) => {
        const matchedKeywords = setting.keywords
          .filter((keyword) => haystack.includes(keyword.toLowerCase()))
          .slice(0, 3);
        const scopeLabel = getKeywordNotificationScope(post, setting.categoryScope);
        const keywordLabel = matchedKeywords.join(", ");

        return createNotification({
          userId: setting.userId,
          type: "keyword",
          title: keywordLabel ? `키워드 알림 · ${keywordLabel}` : "키워드 알림",
          message: `[${scopeLabel}] "${post.title}" 글이 등록되었습니다.`,
          targetType: "marketplace",
          targetId: post.id,
        });
      }),
  );
}

function getKeywordNotificationScope(post: StoredMarketPost, categoryScope: string[]) {
  const selectedScope = categoryScope.find((scope) =>
    ["마켓플레이스", "중고거래", post.boardType, post.itemCategory].includes(scope),
  );
  const boardLabel = selectedScope === "중고거래" ? "마켓플레이스" : (selectedScope ?? "마켓플레이스");

  return post.itemCategory && boardLabel !== post.itemCategory
    ? `${boardLabel} · ${post.itemCategory}`
    : boardLabel;
}

export async function removeUserMarketPostBookmarks(userId: string, postIds: string[]) {
  const idSet = new Set(postIds);
  const posts = await readPosts();
  const removedIds: string[] = [];

  for (const post of posts) {
    if (!idSet.has(post.id) || !post.bookmarkedBy.includes(userId)) continue;

    post.bookmarkedBy = post.bookmarkedBy.filter((id) => id !== userId);
    delete post.bookmarkedAtBy[userId];
    post.bookmarkCount = post.bookmarkedBy.length;
    post.updatedAt = new Date().toISOString();
    removedIds.push(post.id);
  }

  if (removedIds.length) {
    await writePosts(posts);
  }

  return removedIds;
}

export async function syncMarketplaceAuthorProfile(user: PublicUser) {
  const posts = await readPosts();
  let changed = false;

  posts.forEach((post) => {
    if (post.userId === user.id) {
      if (post.authorNickname !== user.nickname) {
        post.authorNickname = user.nickname;
        changed = true;
      }

      if (post.authorProfileImageUrl !== user.profile.profileImageUrl) {
        post.authorProfileImageUrl = user.profile.profileImageUrl;
        changed = true;
      }
    }

    post.comments.forEach((comment) => {
      if (comment.userId !== user.id) return;

      if (comment.authorNickname !== user.nickname) {
        comment.authorNickname = user.nickname;
        changed = true;
      }

      if (comment.authorProfileImageUrl !== user.profile.profileImageUrl) {
        comment.authorProfileImageUrl = user.profile.profileImageUrl;
        changed = true;
      }
    });
  });

  if (changed) {
    await writePosts(posts);
  }

  return changed;
}

export async function voteMarketPost(postId: string, user: PublicUser, rawVote: unknown) {
  const posts = await readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) throw new Error("게시글을 찾을 수 없습니다.");

  const vote = normalizeVote(rawVote);
  post.upvotedBy = post.upvotedBy.filter((id) => id !== user.id);
  post.downvotedBy = post.downvotedBy.filter((id) => id !== user.id);

  if (vote === "up") post.upvotedBy.push(user.id);
  if (vote === "down") post.downvotedBy.push(user.id);

  post.upvoteCount = post.upvotedBy.length;
  post.downvoteCount = post.downvotedBy.length;
  post.updatedAt = new Date().toISOString();
  await writePosts(posts);

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

export async function bumpMarketPost(postId: string, user: PublicUser) {
  const posts = await readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) throw new Error("게시글을 찾을 수 없습니다.");
  if (post.userId !== user.id && !["admin", "super_admin", "moderator"].includes(user.role)) {
    throw new Error("본인 게시글만 끌어올릴 수 있습니다.");
  }

  const nextAvailable = getNextBumpAvailableAt(post, user.membershipLevel);
  if (nextAvailable && Date.now() < new Date(nextAvailable).getTime()) {
    throw new Error(`다음 끌어올리기 가능일은 ${new Date(nextAvailable).toLocaleDateString("ko-KR")}입니다.`);
  }

  const now = new Date().toISOString();
  post.bumpedAt = now;
  post.isBoosted = true;
  post.updatedAt = now;
  await writePosts(posts);

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

export async function addMarketPostComment(
  postId: string,
  user: PublicUser,
  input: { content: unknown; parentId?: unknown },
) {
  const posts = await readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) throw new Error("게시글을 찾을 수 없습니다.");

  const parentId = String(input.parentId ?? "").trim() || null;
  const parent = parentId ? post.comments.find((comment) => comment.id === parentId) : null;
  const depth = parent ? parent.depth + 1 : 1;

  if (depth > 3) {
    throw new Error("댓글은 최대 3단계까지만 작성할 수 있습니다.");
  }

  const comment: MarketComment = {
    id: randomUUID(),
    userId: user.id,
    authorNickname: user.nickname,
    authorProfileImageUrl: user.profile.profileImageUrl,
    content: normalizeText(input.content, 1200, "댓글을 입력해 주세요."),
    parentId: parent?.id ?? null,
    depth,
    upvoteCount: 0,
    downvoteCount: 0,
    upvotedBy: [],
    downvotedBy: [],
    userVote: null,
    createdAt: new Date().toISOString(),
  };

  post.comments.push(comment);
  post.commentCount = post.comments.length;
  post.updatedAt = new Date().toISOString();
  await writePosts(posts);

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

export async function updateMarketPostComment(
  postId: string,
  commentId: string,
  user: PublicUser,
  rawContent: unknown,
) {
  const posts = await readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) throw new Error("게시글을 찾을 수 없습니다.");

  const comment = post.comments.find((item) => item.id === commentId);
  if (!comment) throw new Error("댓글을 찾을 수 없습니다.");

  if (comment.userId !== user.id && !["admin", "super_admin", "moderator"].includes(user.role)) {
    throw new Error("댓글을 수정할 권한이 없습니다.");
  }

  comment.content = normalizeText(rawContent, 1200, "댓글을 입력해 주세요.");
  post.updatedAt = new Date().toISOString();
  await writePosts(posts);

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

export async function deleteMarketPostComment(postId: string, commentId: string, user: PublicUser) {
  const posts = await readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) throw new Error("게시글을 찾을 수 없습니다.");

  const comment = post.comments.find((item) => item.id === commentId);
  if (!comment) throw new Error("댓글을 찾을 수 없습니다.");

  if (comment.userId !== user.id && !["admin", "super_admin", "moderator"].includes(user.role)) {
    throw new Error("댓글을 삭제할 권한이 없습니다.");
  }

  const idsToDelete = new Set<string>([commentId]);
  let changed = true;

  while (changed) {
    changed = false;
    post.comments.forEach((item) => {
      if (item.parentId && idsToDelete.has(item.parentId) && !idsToDelete.has(item.id)) {
        idsToDelete.add(item.id);
        changed = true;
      }
    });
  }

  post.comments = post.comments.filter((item) => !idsToDelete.has(item.id));
  post.commentCount = post.comments.length;
  post.updatedAt = new Date().toISOString();
  await writePosts(posts);

  return toPublicMarketPost(post, user.id, user.membershipLevel);
}

export async function voteMarketPostComment(
  postId: string,
  commentId: string,
  user: PublicUser,
  rawVote: unknown,
) {
  const posts = await readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) throw new Error("게시글을 찾을 수 없습니다.");

  const comment = post.comments.find((item) => item.id === commentId);
  if (!comment) throw new Error("댓글을 찾을 수 없습니다.");

  const vote = normalizeVote(rawVote);
  comment.upvotedBy = (comment.upvotedBy ?? []).filter((id) => id !== user.id);
  comment.downvotedBy = (comment.downvotedBy ?? []).filter((id) => id !== user.id);

  if (vote === "up") comment.upvotedBy.push(user.id);
  if (vote === "down") comment.downvotedBy.push(user.id);

  comment.upvoteCount = comment.upvotedBy.length;
  comment.downvoteCount = comment.downvotedBy.length;
  post.updatedAt = new Date().toISOString();
  await writePosts(posts);

  return toPublicMarketPost(post, user.id);
}

export async function getMarketPostById(
  postId: string,
  currentUserId?: string | null,
  options: { externalizeImages?: boolean } = {},
) {
  let posts = await readPosts();
  let post = getPostMap(posts).get(postId);

  if (!post) {
    posts = await readPosts({ force: true });
    post = getPostMap(posts).get(postId);
  }

  if (!post) {
    post = (await readSinglePost(postId)) ?? undefined;
  }

  if (!post) return null;

  const publicPost = toPublicMarketPost(post, currentUserId, "iron", options);

  const shouldLoadAuthor =
    Boolean(post.userId) &&
    (!publicPost.authorProfileImageUrl ||
      publicPost.contactMethods?.some((method) => !publicPost.contactValues?.[method]));

  if (post.userId && shouldLoadAuthor) {
    const author = await findUserById(post.userId);

    const authorProfileImageUrl = author?.profile.profileImageUrl ?? publicPost.authorProfileImageUrl;
    publicPost.authorProfileImageUrl = options.externalizeImages
      ? externalizeProfileImage(authorProfileImageUrl, post.id)
      : authorProfileImageUrl;

    const contactDisplays = publicPost.contactMethods?.map((method) => (
      getContactDisplay(method, publicPost.contactValues?.[method] ?? getContactValueFromUser(author, method))
    )) ?? [publicPost.contactDisplay];

    if (contactDisplays.length) {
      publicPost.contactDisplays = contactDisplays;
      publicPost.contactDisplay = contactDisplays[0];
    }
  }

  return publicPost;
}

export async function incrementMarketPostViews(postId: string, options: { defer?: boolean } = {}) {
  const posts = await readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) return null;

  post.viewCount += 1;
  await writePosts(posts, { defer: options.defer });

  return post;
}

export function toMarketPostActionResult(post: PublicMarketPost) {
  return {
    bookmarkCount: post.bookmarkCount,
    commentCount: post.commentCount,
    downvoteCount: post.downvoteCount,
    id: post.id,
    isBookmarked: post.isBookmarked,
    isBoosted: post.isBoosted,
    myPurchaseRequest: post.myPurchaseRequest,
    nextBumpAvailableAt: post.nextBumpAvailableAt,
    pointAwardedAt: post.pointAwardedAt,
    purchaseRequests: post.isOwner ? post.purchaseRequests : [],
    selectedBuyerId: post.selectedBuyerId,
    selectedPurchaseRequest: post.selectedPurchaseRequest,
    status: post.status,
    updatedAt: post.updatedAt,
    upvoteCount: post.upvoteCount,
    userVote: post.userVote,
    viewCount: post.viewCount,
  };
}

function toMarketPostListItem(
  post: StoredMarketPost,
  currentUserId?: string | null,
  latestAuthorProfileImageUrl?: string | null,
): PublicMarketPost {
  const coverImage = getCoverImage(post.images, post.coverImageId);
  const contactMethods = getStoredContactMethods(post);
  const contactValues = getStoredContactValues(post, contactMethods);
  const contactDisplays = contactMethods.map((method) => getContactDisplay(method, contactValues[method] ?? null));

  return {
    ...post,
    authorProfileImageUrl: externalizeProfileImage(latestAuthorProfileImageUrl ?? post.authorProfileImageUrl, post.id),
    isOwner: Boolean(currentUserId && post.userId === currentUserId),
    priceLabel: getPriceLabel(post.priceType, post.priceAmount),
    thumbLabel: getThumbLabel(post.title),
    coverImageUrl: getListCoverImageUrl(post, coverImage),
    contactMethods,
    contactValues,
    contactDisplay: contactDisplays[0],
    contactDisplays,
    isBookmarked: Boolean(currentUserId && post.bookmarkedBy.includes(currentUserId)),
    bookmarkedAt: currentUserId && post.bookmarkedBy.includes(currentUserId)
      ? post.bookmarkedAtBy[currentUserId] ?? post.updatedAt ?? post.createdAt
      : null,
    myPurchaseRequest: currentUserId
      ? post.purchaseRequests.find((request) => request.buyerId === currentUserId) ?? null
      : null,
    selectedPurchaseRequest: post.purchaseRequests.find((request) => request.buyerId === post.selectedBuyerId) ?? null,
    userVote: currentUserId
      ? post.upvotedBy.includes(currentUserId)
        ? "up"
        : post.downvotedBy.includes(currentUserId)
          ? "down"
          : null
      : null,
    nextBumpAvailableAt: getNextBumpAvailableAt(post),
    comments: [],
    content: post.content.slice(0, 500),
    contentHtml: "",
    images: [],
    thumbnailDataUrl: null,
  };
}

function getListCoverImageUrl(post: StoredMarketPost, image: MarketPostImage | null) {
  if (image) return getMarketImageUrl(post.id, image.id, "thumb");
  if (post.thumbnailDataUrl) return getMarketImageUrl(post.id, "thumbnail", "thumb");
  return null;
}

function getThumbnailFromImage(image: MarketPostImage | null) {
  if (!image) return null;
  return image.thumbnailDataUrl ?? image.dataUrl;
}

function toPublicMarketPost(
  post: StoredMarketPost,
  currentUserId?: string | null,
  membershipLevel = "iron",
  options: { externalizeImages?: boolean } = {},
): PublicMarketPost {
  const coverImage = getCoverImage(post.images, post.coverImageId);
  const nextBumpAvailableAt = getNextBumpAvailableAt(post, membershipLevel);
  const contactMethods = getStoredContactMethods(post);
  const contactValues = getStoredContactValues(post, contactMethods);
  const contactDisplays = contactMethods.map((method) => getContactDisplay(method, contactValues[method] ?? null));
  const images = options.externalizeImages ? externalizeImages(post) : post.images;
  const contentHtml = options.externalizeImages ? externalizeContentImages(post.contentHtml, post.images, post.id) : post.contentHtml;
  const thumbnailDataUrl = options.externalizeImages && post.thumbnailDataUrl
    ? getMarketImageUrl(post.id, "thumbnail", "thumb")
    : post.thumbnailDataUrl;

  return {
    ...post,
    contactMethods,
    contactValues,
    authorProfileImageUrl: options.externalizeImages
      ? externalizeProfileImage(post.authorProfileImageUrl, post.id)
      : post.authorProfileImageUrl,
    isOwner: Boolean(currentUserId && post.userId === currentUserId),
    priceLabel: getPriceLabel(post.priceType, post.priceAmount),
    thumbLabel: getThumbLabel(post.title),
    coverImageUrl: options.externalizeImages
      ? getListCoverImageUrl(post, coverImage)
      : coverImage?.thumbnailDataUrl ?? coverImage?.dataUrl ?? post.thumbnailDataUrl,
    contactDisplay: contactDisplays[0],
    contactDisplays,
    isBookmarked: Boolean(currentUserId && post.bookmarkedBy.includes(currentUserId)),
    bookmarkedAt: currentUserId && post.bookmarkedBy.includes(currentUserId)
      ? post.bookmarkedAtBy[currentUserId] ?? post.updatedAt ?? post.createdAt
      : null,
    myPurchaseRequest: currentUserId
      ? post.purchaseRequests.find((request) => request.buyerId === currentUserId) ?? null
      : null,
    selectedPurchaseRequest: post.purchaseRequests.find((request) => request.buyerId === post.selectedBuyerId) ?? null,
    userVote: currentUserId
      ? post.upvotedBy.includes(currentUserId)
        ? "up"
        : post.downvotedBy.includes(currentUserId)
          ? "down"
          : null
      : null,
    nextBumpAvailableAt,
    comments: toPublicComments(
      post.comments,
      currentUserId,
      options.externalizeImages ? post.id : undefined,
    ),
    contentHtml,
    images,
    thumbnailDataUrl,
  };
}

function getCompactImageUrl(value: string | null | undefined) {
  if (!value) return null;
  if (value.length > 200_000) return null;
  return value;
}

function getMarketImageUrl(postId: string, imageId: string, variant: "full" | "thumb" = "full") {
  return `/api/marketplace/posts/${encodeURIComponent(postId)}/images/${encodeURIComponent(imageId)}?variant=${variant}`;
}

function externalizeProfileImage(value: string | null | undefined, postId: string) {
  if (!value) return null;
  if (!value.startsWith("data:image")) return value;
  return getMarketImageUrl(postId, "author", "thumb");
}

function externalizeImages(post: StoredMarketPost): MarketPostImage[] {
  return post.images.map((image) => ({
    ...image,
    dataUrl: getMarketImageUrl(post.id, image.id),
    thumbnailDataUrl: getMarketImageUrl(post.id, image.id, "thumb"),
  }));
}

function externalizeContentImages(contentHtml: string, images: MarketPostImage[], postId: string) {
  const withoutAttachmentImages = images.reduce((html, image) => {
    let nextHtml = html.split(image.dataUrl).join(getMarketImageUrl(postId, image.id));

    if (image.thumbnailDataUrl) {
      nextHtml = nextHtml.split(image.thumbnailDataUrl).join(getMarketImageUrl(postId, image.id, "thumb"));
    }

    return nextHtml;
  }, contentHtml);

  return extractContentImageDataUrls(withoutAttachmentImages).reduce(
    (html, dataUrl, index) => html.split(dataUrl).join(getMarketImageUrl(postId, `content-${index}`)),
    withoutAttachmentImages,
  );
}

function extractContentImageDataUrls(contentHtml: string) {
  return Array.from(contentHtml.matchAll(/<img\b[^>]*\bsrc=(["'])(data:image[^"']+)\1/gi)).map((match) => match[2]);
}

function normalizeStoredPost(post: StoredMarketPost): StoredMarketPost {
  const legacyImage = normalizeThumbnail(post.thumbnailDataUrl);
  const contentHtml = normalizeHtml(post.contentHtml, post.content);
  const contentImageUrl = getFirstContentImageUrl(contentHtml);
  const images = normalizeImages(
    post.images?.length
      ? post.images
      : legacyImage
        ? [{ id: "legacy-cover", dataUrl: legacyImage, alt: post.title, createdAt: post.createdAt }]
        : [],
    post.createdAt,
  );
  const coverImageId = normalizeCoverImageId(post.coverImageId, images);
  const coverImage = getCoverImage(images, coverImageId);
  const contactMethod = normalizeContactMethod(post.contactMethod);
  const contactMethods = normalizeContactMethods(post.contactMethods ?? contactMethod);
  const contactValues = getStoredContactValues({ ...post, contactMethod }, contactMethods);

  return {
    ...post,
    boardType: normalizeBoardType(post.boardType),
    itemCategory: normalizeItemCategory(post.itemCategory),
    priceType: normalizePriceType(post.priceType),
    priceAmount: post.priceType === "amount" ? normalizePriceAmount(post.priceAmount) : null,
    region: normalizeRegion(post.region),
    tradeMethod: normalizeTradeMethod(post.tradeMethod),
    itemCondition: normalizeItemCondition(post.itemCondition),
    contactMethod,
    contactValue: normalizeOptionalContactValue(post.contactValue, 120),
    contactMethods,
    contactValues,
    status: normalizeStatus(post.status),
    contentHtml,
    thumbnailDataUrl: getThumbnailFromImage(coverImage) ?? legacyImage ?? contentImageUrl,
    images,
    coverImageId,
    upvoteCount: Number.isFinite(post.upvoteCount) ? post.upvoteCount : 0,
    downvoteCount: Number.isFinite(post.downvoteCount) ? post.downvoteCount : 0,
    bookmarkedBy: Array.isArray(post.bookmarkedBy) ? post.bookmarkedBy.map(String) : [],
    bookmarkedAtBy: normalizeBookmarkDates(post.bookmarkedAtBy, post.bookmarkedBy, post.updatedAt ?? post.createdAt),
    purchaseRequests: normalizePurchaseRequests(post.purchaseRequests),
    selectedBuyerId: typeof post.selectedBuyerId === "string" ? post.selectedBuyerId : null,
    pointAwardedAt: typeof post.pointAwardedAt === "string" ? post.pointAwardedAt : null,
    upvotedBy: Array.isArray(post.upvotedBy) ? post.upvotedBy.map(String) : [],
    downvotedBy: Array.isArray(post.downvotedBy) ? post.downvotedBy.map(String) : [],
    bookmarkCount: Array.isArray(post.bookmarkedBy) && post.bookmarkedBy.length
      ? post.bookmarkedBy.length
      : Number.isFinite(post.bookmarkCount)
        ? post.bookmarkCount
        : 0,
    comments: normalizeComments(post.comments),
    commentCount: Array.isArray(post.comments) && post.comments.length ? post.comments.length : Number(post.commentCount ?? 0),
    isBoosted: Boolean(post.isBoosted),
    bumpedAt: post.bumpedAt ?? null,
  };
}

function getPriceLabel(priceType: MarketPriceType, priceAmount: number | null) {
  if (priceType === "free") return "무료나눔";
  if (priceType === "offer") return "가격제안";
  return `$${Number(priceAmount ?? 0).toLocaleString()}`;
}

function getThumbLabel(title: string) {
  const cleaned = title.replace(/[^a-zA-Z0-9가-힣]/g, "").trim();

  return (cleaned || "MK").slice(0, 2).toUpperCase();
}

function getSortDate(post: StoredMarketPost) {
  return post.bumpedAt ?? post.createdAt;
}

function normalizeText(value: unknown, maxLength: number, message: string) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!text) throw new Error(message);

  return text.slice(0, maxLength);
}

function normalizeBoardType(value: unknown): MarketBoardType {
  if (marketBoardTypes.includes(value as MarketBoardType)) return value as MarketBoardType;
  return "개인판매";
}

function normalizeItemCategory(value: unknown): MarketItemCategory {
  if (marketItemCategories.includes(value as MarketItemCategory)) {
    return value as MarketItemCategory;
  }

  return "기타";
}

function normalizePriceType(value: unknown): MarketPriceType {
  if (value === "free" || value === "offer") return value;
  return "amount";
}

function normalizePriceAmount(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error("가격을 올바르게 입력해 주세요.");
  }

  return Math.round(numberValue * 100) / 100;
}

function normalizeRegion(value: unknown) {
  const text = String(value ?? "").trim();
  return marketRegions.includes(text) || hamiltonSuburbs.includes(text) ? text : "기타";
}

function normalizeStatus(value: unknown): MarketStatus {
  if (marketStatuses.includes(value as MarketStatus)) return value as MarketStatus;
  return "판매중";
}

function getPostForTradeAction(posts: StoredMarketPost[], postId: string) {
  const post = posts.find((item) => item.id === postId);
  if (!post) {
    throw new Error("게시글을 찾을 수 없습니다.");
  }

  post.purchaseRequests = normalizePurchaseRequests(post.purchaseRequests);
  post.selectedBuyerId = typeof post.selectedBuyerId === "string" ? post.selectedBuyerId : null;
  post.pointAwardedAt = typeof post.pointAwardedAt === "string" ? post.pointAwardedAt : null;

  return post;
}

function ensurePostOwner(post: StoredMarketPost, user: PublicUser) {
  if (post.userId !== user.id && !["admin", "super_admin", "moderator"].includes(user.role)) {
    throw new Error("본인 게시글만 거래를 관리할 수 있습니다.");
  }
}

function normalizePurchaseRequests(value: unknown): MarketPurchaseRequest[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((request) => {
      const source = request && typeof request === "object" ? request as Record<string, unknown> : {};
      const buyerId = String(source.buyerId ?? "").trim();
      const buyerNickname = String(source.buyerNickname ?? "").trim();
      if (!buyerId || !buyerNickname) return null;

      const status: MarketPurchaseRequestStatus = source.status === "selected" ||
        source.status === "buyer_confirmed" ||
        source.status === "seller_confirmed"
        ? source.status
        : "requested";

      return {
        id: String(source.id ?? randomUUID()),
        buyerId,
        buyerNickname,
        status,
        requestedAt: normalizeIsoDate(source.requestedAt) ?? new Date().toISOString(),
        selectedAt: normalizeIsoDate(source.selectedAt),
        buyerConfirmedAt: normalizeIsoDate(source.buyerConfirmedAt),
        sellerConfirmedAt: normalizeIsoDate(source.sellerConfirmedAt),
      };
    })
    .filter((request): request is NonNullable<typeof request> => Boolean(request));
}

function normalizeIsoDate(value: unknown) {
  if (typeof value !== "string") return null;
  return Number.isNaN(new Date(value).getTime()) ? null : value;
}

function normalizeVote(value: unknown): MarketVoteType | null {
  if (value === "up" || value === "down") return value;
  return null;
}

function normalizeTradeMethod(value: unknown): MarketTradeMethod {
  if (marketTradeMethods.includes(value as MarketTradeMethod)) return value as MarketTradeMethod;
  return "직거래";
}

function normalizeItemCondition(value: unknown): MarketItemCondition {
  if (marketItemConditions.includes(value as MarketItemCondition)) return value as MarketItemCondition;
  return "사용감 있음";
}

function normalizeContactMethod(value: unknown): MarketContactMethod {
  if (value === "email" || value === "kakao" || value === "phone" || value === "korin_chat") {
    return value;
  }

  return "korin_chat";
}

function normalizeContactMethods(value: unknown): MarketContactMethod[] {
  const rawMethods = Array.isArray(value) ? value : [value];
  const methods = rawMethods.map(normalizeContactMethod);
  const uniqueMethods = [...new Set(methods)];

  return uniqueMethods.length ? uniqueMethods : ["korin_chat"];
}

function getStoredContactMethods(post: Pick<StoredMarketPost, "contactMethod" | "contactMethods">) {
  return normalizeContactMethods(post.contactMethods?.length ? post.contactMethods : post.contactMethod);
}

function getStoredContactValues(
  post: Pick<StoredMarketPost, "contactMethod" | "contactValue" | "contactValues">,
  methods: MarketContactMethod[],
) {
  return methods.reduce<Partial<Record<MarketContactMethod, string | null>>>((values, method) => {
    const storedValue = post.contactValues?.[method];
    values[method] = normalizeOptionalContactValue(
      storedValue ?? (method === post.contactMethod ? post.contactValue : null),
      120,
    );
    return values;
  }, {});
}

function normalizeContactForPost(
  user: PublicUser,
  input: {
    contactMethod?: unknown;
    contactMethods?: unknown;
    contactPhoneNumber?: unknown;
    contactKakaoTalkId?: unknown;
  },
): {
  method: MarketContactMethod;
  value: string | null;
  methods: MarketContactMethod[];
  values: Partial<Record<MarketContactMethod, string | null>>;
} {
  const methods = normalizeContactMethods(input.contactMethods ?? input.contactMethod);
  const values: Partial<Record<MarketContactMethod, string | null>> = {};

  methods.forEach((method) => {
    values[method] = getValidatedContactValue(user, input, method);
  });

  const method = methods[0];

  return { method, value: values[method] ?? null, methods, values };
}

function getValidatedContactValue(
  user: PublicUser,
  input: {
    contactPhoneNumber?: unknown;
    contactKakaoTalkId?: unknown;
  },
  method: MarketContactMethod,
) {
  if (method === "email") {
    if (!user.email) throw new Error("이메일 연락을 선택하려면 계정 이메일이 필요합니다.");
    return user.email;
  }

  if (method === "kakao") {
    const value = normalizeOptionalContactValue(input.contactKakaoTalkId, 40) ?? user.profile.kakaoTalkId;
    if (!value) throw new Error("카카오톡 연락을 선택하려면 카카오톡 ID를 입력해 주세요.");
    return value;
  }

  if (method === "phone") {
    const value = normalizeOptionalContactValue(input.contactPhoneNumber, 40)
      ?? user.profile.smartphoneNumber
      ?? user.phone;
    if (!value) throw new Error("전화번호 연락을 선택하려면 전화번호를 입력해 주세요.");
    return value;
  }

  return null;
}

function normalizeOptionalContactValue(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return text ? text.slice(0, maxLength) : null;
}

function getContactValueFromUser(user: PublicUser | null, method: MarketContactMethod) {
  if (!user) return null;
  if (method === "email") return user.email;
  if (method === "kakao") return user.profile.kakaoTalkId;
  if (method === "phone") return user.profile.smartphoneNumber ?? user.phone;
  return null;
}

function getContactDisplay(method: MarketContactMethod, value: string | null): MarketContactDisplay {
  if (method === "email") {
    return {
      method,
      label: "이메일",
      value: value ?? "이메일 정보가 없습니다.",
      description: "판매자가 이메일 연락을 선택했습니다.",
    };
  }

  if (method === "kakao") {
    return {
      method,
      label: "카카오톡",
      value: value ?? "카카오톡 ID 정보가 없습니다.",
      description: "판매자가 카카오톡 연락을 선택했습니다.",
    };
  }

  if (method === "phone") {
    return {
      method,
      label: "전화번호",
      value: value ?? "전화번호 정보가 없습니다.",
      description: "판매자가 전화번호 연락을 선택했습니다.",
    };
  }

  return {
    method,
    label: "KumaraMarket.nz 1:1 채팅",
    value: "KumaraMarket.nz 사이트를 통해 1:1 연락채팅 가능",
    description: "판매자가 KumaraMarket.nz 채팅 연락을 선택했습니다.",
  };
}

function normalizeThumbnail(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (!text.startsWith("data:image/")) return null;

  return text;
}

function getFirstContentImageUrl(contentHtml: string) {
  const match = contentHtml.match(/<img\b[^>]*\bsrc=(["'])(.*?)\1/i);
  const imageUrl = match?.[2]?.trim();

  return normalizeThumbnail(imageUrl);
}

function normalizeImages(value: unknown, fallbackDate: string): MarketPostImage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map<MarketPostImage | null>((item, index) => {
      const maybeImage = item as Partial<MarketPostImage>;
      const dataUrl = normalizeThumbnail(maybeImage.dataUrl);

      if (!dataUrl) return null;

      return {
        id: String(maybeImage.id ?? randomUUID()),
        dataUrl,
        alt: String(maybeImage.alt ?? `image-${index + 1}`).trim().slice(0, 80),
        thumbnailDataUrl: normalizeThumbnail(maybeImage.thumbnailDataUrl) ?? dataUrl,
        createdAt: String(maybeImage.createdAt ?? fallbackDate),
      };
    })
    .filter((item): item is MarketPostImage => Boolean(item))
    .slice(0, 20);
}

function normalizeCoverImageId(value: unknown, images: MarketPostImage[]) {
  const id = String(value ?? "");

  if (images.some((image) => image.id === id)) return id;
  return images[0]?.id ?? null;
}

function getCoverImage(images: MarketPostImage[], coverImageId: string | null) {
  return images.find((image) => image.id === coverImageId) ?? images[0] ?? null;
}

function normalizeComments(value: unknown): MarketComment[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): MarketComment | null => {
      const maybeComment = item as Partial<MarketComment>;
      const content = String(maybeComment.content ?? "").trim();
      if (!content) return null;

      return {
        id: String(maybeComment.id ?? randomUUID()),
        userId: String(maybeComment.userId ?? ""),
        authorNickname: String(maybeComment.authorNickname ?? "KumaraMarket.nz User").slice(0, 40),
        authorProfileImageUrl: maybeComment.authorProfileImageUrl ?? null,
        content: content.slice(0, 1200),
        parentId: maybeComment.parentId ? String(maybeComment.parentId) : null,
        depth: Math.min(3, Math.max(1, Number(maybeComment.depth ?? 1))),
        upvoteCount: Number(maybeComment.upvoteCount ?? 0),
        downvoteCount: Number(maybeComment.downvoteCount ?? 0),
        upvotedBy: Array.isArray(maybeComment.upvotedBy) ? maybeComment.upvotedBy.map(String) : [],
        downvotedBy: Array.isArray(maybeComment.downvotedBy) ? maybeComment.downvotedBy.map(String) : [],
        userVote: null,
        createdAt: String(maybeComment.createdAt ?? new Date().toISOString()),
      };
    })
    .filter((item): item is MarketComment => Boolean(item));
}

function normalizeBookmarkDates(
  value: unknown,
  bookmarkedBy: unknown,
  fallbackDate: string,
) {
  const bookmarkedUserIds = Array.isArray(bookmarkedBy) ? bookmarkedBy.map(String) : [];
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};

  return bookmarkedUserIds.reduce<Record<string, string>>((dates, userId) => {
    const rawDate = source[userId];
    const date = typeof rawDate === "string" && !Number.isNaN(new Date(rawDate).getTime())
      ? rawDate
      : fallbackDate;

    dates[userId] = date;

    return dates;
  }, {});
}

function toPublicComments(
  comments: MarketComment[],
  currentUserId?: string | null,
  externalImagePostId?: string,
): MarketComment[] {
  return comments.map((comment) => ({
    ...comment,
    authorProfileImageUrl: externalImagePostId
      ? externalizeCommentProfileImage(comment.authorProfileImageUrl, externalImagePostId, comment.id)
      : comment.authorProfileImageUrl,
    userVote: currentUserId
      ? comment.upvotedBy?.includes(currentUserId)
        ? "up"
        : comment.downvotedBy?.includes(currentUserId)
          ? "down"
          : null
      : null,
  }));
}

function externalizeCommentProfileImage(value: string | null | undefined, postId: string, commentId: string) {
  if (!value) return null;
  if (!value.startsWith("data:image")) return value;
  return getMarketImageUrl(postId, `comment-author-${commentId}`, "thumb");
}

function toggleArrayValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function getNextBumpAvailableAt(post: StoredMarketPost, level = "iron") {
  if (!post.bumpedAt) return null;

  const intervalDaysByLevel: Record<string, number> = {
    iron: 7,
    silver: 6,
    gold: 5,
    platinum: 3,
    diamond: 2,
    master: 1,
    master_plus: 1,
  };
  const intervalDays = intervalDaysByLevel[level] ?? 7;
  const date = new Date(post.bumpedAt);
  date.setDate(date.getDate() + intervalDays);

  return date.toISOString();
}

function normalizeHtml(value: unknown, fallbackText: string) {
  const raw = String(value ?? "").trim();
  const html = raw || `<p>${escapeHtml(fallbackText)}</p>`;

  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\sjavascript:/gi, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
