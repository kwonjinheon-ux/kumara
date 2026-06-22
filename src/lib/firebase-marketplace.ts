import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import type { User } from "firebase/auth";

import { getFirebaseStorage, getFirestoreDb } from "@/lib/firebase";
import type {
  MarketBoardType,
  MarketComment,
  MarketContactDisplay,
  MarketContactMethod,
  MarketItemCategory,
  MarketItemCondition,
  MarketPostImage,
  MarketPriceType,
  MarketStatus,
  MarketTradeMethod,
  MarketVoteType,
  PublicMarketPost,
  StoredMarketPost,
} from "@/types/marketplace";

type SavePostInput = Record<string, unknown>;

const defaultStatus = "판매중" as MarketStatus;

export async function listFirebaseMarketPosts(currentUserId?: string | null, maxCount = 80) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), "posts"), orderBy("createdAt", "desc"), limit(maxCount)));
  const posts = await Promise.all(snapshot.docs.map((item) => toPublicMarketPost(item.id, item.data(), currentUserId)));
  return posts;
}

export async function getFirebaseMarketPost(postId: string, currentUserId?: string | null) {
  const snapshot = await getDoc(doc(getFirestoreDb(), "posts", postId));
  if (!snapshot.exists()) return null;
  return toPublicMarketPost(snapshot.id, snapshot.data(), currentUserId, true);
}

export async function saveFirebaseMarketPost(input: {
  currentUser: User;
  payload: SavePostInput;
  postId?: string;
}) {
  const now = new Date().toISOString();
  const db = getFirestoreDb();
  const postRef = input.postId ? doc(db, "posts", input.postId) : doc(collection(db, "posts"));
  const existing = input.postId ? await getDoc(postRef) : null;

  if (existing?.exists() && existing.data().authorId !== input.currentUser.uid) {
    throw new Error("게시글 작성자만 수정할 수 있습니다.");
  }

  const images = await uploadPostImages(postRef.id, normalizeImages(input.payload.images));
  const inlineImages = getInlineImages(input.payload.contentHtml);
  const allImages = [...images, ...inlineImages];
  const thumbnailDataUrl = firstString(input.payload.thumbnailDataUrl) ?? allImages[0]?.dataUrl ?? null;
  const data = {
    id: postRef.id,
    title: firstString(input.payload.title) ?? "",
    content: firstString(input.payload.content) ?? "",
    contentHtml: firstString(input.payload.contentHtml) ?? "",
    category: firstString(input.payload.itemCategory) ?? "",
    boardType: firstString(input.payload.boardType) ?? "",
    itemCategory: firstString(input.payload.itemCategory) ?? "",
    price: parsePrice(input.payload.priceAmount),
    priceAmount: parsePrice(input.payload.priceAmount),
    priceType: firstString(input.payload.priceType) ?? "amount",
    location: firstString(input.payload.region) ?? "",
    region: firstString(input.payload.region) ?? "",
    tradeMethod: firstString(input.payload.tradeMethod) ?? "",
    itemCondition: firstString(input.payload.itemCondition) ?? "",
    contactMethod: firstString(input.payload.contactMethod) ?? "korin_chat",
    contactMethods: Array.isArray(input.payload.contactMethods) ? input.payload.contactMethods.map(String) : ["korin_chat"],
    contactValues: {
      kakao: firstString(input.payload.contactKakaoTalkId),
      phone: firstString(input.payload.contactPhoneNumber),
    },
    imageUrls: allImages.map((image) => image.dataUrl),
    images: allImages,
    thumbnailDataUrl,
    coverImageId: firstString(input.payload.coverImageId) ?? allImages[0]?.id ?? null,
    authorId: input.currentUser.uid,
    userId: input.currentUser.uid,
    authorName: input.currentUser.displayName ?? input.currentUser.email?.split("@")[0] ?? "User",
    authorNickname: input.currentUser.displayName ?? input.currentUser.email?.split("@")[0] ?? "User",
    authorPhotoURL: input.currentUser.photoURL ?? null,
    authorProfileImageUrl: input.currentUser.photoURL ?? null,
    status: existing?.exists() ? existing.data().status ?? defaultStatus : defaultStatus,
    updatedAt: serverTimestamp(),
    updatedAtIso: now,
    ...(existing?.exists()
      ? {}
      : {
          bookmarkCount: 0,
          commentCount: 0,
          createdAt: serverTimestamp(),
          createdAtIso: now,
          downvoteCount: 0,
          isBoosted: false,
          likeCount: 0,
          upvoteCount: 0,
          viewCount: 0,
        }),
  };

  await setDoc(postRef, data, { merge: true });
  const saved = await getFirebaseMarketPost(postRef.id, input.currentUser.uid);
  return saved ?? ({ id: postRef.id } as PublicMarketPost);
}

export async function deleteFirebaseMarketPost(postId: string, currentUser: User) {
  const postRef = doc(getFirestoreDb(), "posts", postId);
  const snapshot = await getDoc(postRef);
  if (!snapshot.exists()) return;
  if (snapshot.data().authorId !== currentUser.uid) {
    throw new Error("게시글 작성자만 삭제할 수 있습니다.");
  }
  await deleteDoc(postRef);
}

export async function toggleFirebaseBookmark(postId: string, currentUser: User) {
  const db = getFirestoreDb();
  const postRef = doc(db, "posts", postId);
  const bookmarkRef = doc(db, "users", currentUser.uid, "bookmarks", postId);

  await runTransaction(db, async (transaction) => {
    const bookmark = await transaction.get(bookmarkRef);
    if (bookmark.exists()) {
      transaction.delete(bookmarkRef);
      transaction.update(postRef, { bookmarkCount: increment(-1) });
    } else {
      transaction.set(bookmarkRef, { postId, createdAt: serverTimestamp() });
      transaction.update(postRef, { bookmarkCount: increment(1) });
    }
  });

  return getFirebaseMarketPost(postId, currentUser.uid);
}

export async function voteFirebasePost(postId: string, currentUser: User, vote: MarketVoteType | null) {
  const db = getFirestoreDb();
  const postRef = doc(db, "posts", postId);
  const voteRef = doc(db, "posts", postId, "likes", currentUser.uid);

  await runTransaction(db, async (transaction) => {
    const existingVote = await transaction.get(voteRef);
    const previous = existingVote.exists() ? existingVote.data().vote : null;
    const patch: Record<string, ReturnType<typeof increment>> = {};

    if (previous === "up") patch.upvoteCount = increment(-1);
    if (previous === "down") patch.downvoteCount = increment(-1);
    if (vote === "up") patch.upvoteCount = increment(1);
    if (vote === "down") patch.downvoteCount = increment(1);

    if (vote) {
      transaction.set(voteRef, { uid: currentUser.uid, vote, updatedAt: serverTimestamp() });
    } else {
      transaction.delete(voteRef);
    }
    transaction.update(postRef, patch);
  });

  return getFirebaseMarketPost(postId, currentUser.uid);
}

export async function addFirebaseComment(input: {
  postId: string;
  currentUser: User;
  content: string;
  parentId?: string | null;
}) {
  const db = getFirestoreDb();
  const commentsRef = collection(db, "posts", input.postId, "comments");
  await addDoc(commentsRef, {
    authorId: input.currentUser.uid,
    authorName: input.currentUser.displayName ?? input.currentUser.email?.split("@")[0] ?? "User",
    authorPhotoURL: input.currentUser.photoURL ?? null,
    content: input.content,
    createdAt: serverTimestamp(),
    downvoteCount: 0,
    parentId: input.parentId ?? null,
    upvoteCount: 0,
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "posts", input.postId), { commentCount: increment(1) });
  return getFirebaseMarketPost(input.postId, input.currentUser.uid);
}

export async function deleteFirebaseComment(postId: string, commentId: string, currentUser: User) {
  const db = getFirestoreDb();
  const commentRef = doc(db, "posts", postId, "comments", commentId);
  const snapshot = await getDoc(commentRef);
  if (!snapshot.exists()) return getFirebaseMarketPost(postId, currentUser.uid);
  if (snapshot.data().authorId !== currentUser.uid) throw new Error("댓글 작성자만 삭제할 수 있습니다.");
  await deleteDoc(commentRef);
  await updateDoc(doc(db, "posts", postId), { commentCount: increment(-1) });
  return getFirebaseMarketPost(postId, currentUser.uid);
}

export async function updateFirebaseComment(postId: string, commentId: string, currentUser: User, content: string) {
  const commentRef = doc(getFirestoreDb(), "posts", postId, "comments", commentId);
  const snapshot = await getDoc(commentRef);
  if (!snapshot.exists()) return getFirebaseMarketPost(postId, currentUser.uid);
  if (snapshot.data().authorId !== currentUser.uid) throw new Error("댓글 작성자만 수정할 수 있습니다.");
  await updateDoc(commentRef, {
    content,
    updatedAt: serverTimestamp(),
  });
  return getFirebaseMarketPost(postId, currentUser.uid);
}

async function toPublicMarketPost(
  id: string,
  data: Record<string, unknown>,
  currentUserId?: string | null,
  includeComments = false,
): Promise<PublicMarketPost> {
  const [bookmarkSnapshot, voteSnapshot, comments] = await Promise.all([
    currentUserId ? getDoc(doc(getFirestoreDb(), "users", currentUserId, "bookmarks", id)) : Promise.resolve(null),
    currentUserId ? getDoc(doc(getFirestoreDb(), "posts", id, "likes", currentUserId)) : Promise.resolve(null),
    includeComments ? listComments(id, currentUserId) : Promise.resolve([]),
  ]);
  const images = normalizeImages(data.images);
  const createdAt = toIso(data.createdAt) ?? firstString(data.createdAtIso) ?? new Date().toISOString();
  const updatedAt = toIso(data.updatedAt) ?? firstString(data.updatedAtIso) ?? createdAt;
  const priceAmount = typeof data.priceAmount === "number" ? data.priceAmount : typeof data.price === "number" ? data.price : null;
  const priceType = (firstString(data.priceType) ?? (priceAmount ? "amount" : "offer")) as MarketPriceType;
  const contactMethod = (firstString(data.contactMethod) ?? "korin_chat") as MarketContactMethod;
  const contactDisplays = buildContactDisplays(data, contactMethod);
  const post = {
    authorNickname: firstString(data.authorNickname) ?? firstString(data.authorName) ?? "User",
    authorProfileImageUrl: firstString(data.authorProfileImageUrl) ?? firstString(data.authorPhotoURL),
    boardType: (firstString(data.boardType) ?? "ê°œì¸íŒë§¤") as MarketBoardType,
    bookmarkCount: numberValue(data.bookmarkCount),
    bookmarkedAt: bookmarkSnapshot?.exists() ? createdAt : null,
    bookmarkedAtBy: {},
    bookmarkedBy: [],
    bumpedAt: firstString(data.bumpedAt),
    commentCount: numberValue(data.commentCount) || comments.length,
    comments,
    contactDisplay: contactDisplays[0],
    contactDisplays,
    contactMethod,
    contactMethods: Array.isArray(data.contactMethods) ? data.contactMethods.map((item) => String(item) as MarketContactMethod) : [contactMethod],
    contactValue: null,
    content: firstString(data.content) ?? "",
    contentHtml: firstString(data.contentHtml) ?? firstString(data.content) ?? "",
    coverImageId: firstString(data.coverImageId),
    coverImageUrl: firstString(data.thumbnailDataUrl) ?? images[0]?.dataUrl ?? null,
    createdAt,
    downvoteCount: numberValue(data.downvoteCount),
    downvotedBy: [],
    id,
    images,
    isBookmarked: Boolean(bookmarkSnapshot?.exists()),
    isBoosted: Boolean(data.isBoosted),
    isOwner: Boolean(currentUserId && currentUserId === (firstString(data.authorId) ?? firstString(data.userId))),
    itemCategory: (firstString(data.itemCategory) ?? firstString(data.category) ?? "ê¸°íƒ€") as MarketItemCategory,
    itemCondition: (firstString(data.itemCondition) ?? "ìƒíƒœ ì¢‹ìŒ") as MarketItemCondition,
    myPurchaseRequest: null,
    nextBumpAvailableAt: null,
    pointAwardedAt: null,
    priceAmount,
    priceLabel: formatPrice(priceType, priceAmount),
    priceType,
    purchaseRequests: [],
    region: firstString(data.region) ?? firstString(data.location) ?? "",
    selectedBuyerId: null,
    selectedPurchaseRequest: null,
    status: (firstString(data.status) ?? defaultStatus) as MarketStatus,
    thumbLabel: firstString(data.title)?.slice(0, 2) ?? "KM",
    thumbnailDataUrl: firstString(data.thumbnailDataUrl) ?? images[0]?.thumbnailDataUrl ?? images[0]?.dataUrl ?? null,
    title: firstString(data.title) ?? "",
    tradeMethod: (firstString(data.tradeMethod) ?? "í˜‘ì˜") as MarketTradeMethod,
    updatedAt,
    upvoteCount: numberValue(data.upvoteCount) || numberValue(data.likeCount),
    upvotedBy: [],
    userId: firstString(data.authorId) ?? firstString(data.userId),
    userVote: (voteSnapshot?.exists() ? voteSnapshot.data().vote : null) as MarketVoteType | null,
    viewCount: numberValue(data.viewCount),
  } satisfies PublicMarketPost;
  return post;
}

async function listComments(postId: string, currentUserId?: string | null): Promise<MarketComment[]> {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), "posts", postId, "comments"), orderBy("createdAt", "asc")));
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      authorNickname: firstString(data.authorName) ?? "User",
      authorProfileImageUrl: firstString(data.authorPhotoURL),
      content: firstString(data.content) ?? "",
      createdAt: toIso(data.createdAt) ?? new Date().toISOString(),
      depth: data.parentId ? 2 : 1,
      downvoteCount: numberValue(data.downvoteCount),
      downvotedBy: [],
      id: item.id,
      parentId: firstString(data.parentId),
      upvoteCount: numberValue(data.upvoteCount),
      upvotedBy: [],
      userId: firstString(data.authorId) ?? "",
      userVote: null,
    };
  });
}

async function uploadPostImages(postId: string, images: MarketPostImage[]) {
  const uploaded: MarketPostImage[] = [];
  for (const image of images) {
    if (!image.dataUrl.startsWith("data:image/")) {
      uploaded.push(image);
      continue;
    }
    const imageRef = ref(getFirebaseStorage(), `posts/${postId}/${image.id}.jpg`);
    await uploadString(imageRef, image.dataUrl, "data_url");
    const downloadUrl = await getDownloadURL(imageRef);
    uploaded.push({ ...image, dataUrl: downloadUrl, thumbnailDataUrl: downloadUrl });
  }
  return uploaded;
}

function getInlineImages(contentHtml: unknown): MarketPostImage[] {
  const html = firstString(contentHtml) ?? "";
  return Array.from(html.matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1/gi))
    .map((match, index) => match[2])
    .filter((src): src is string => Boolean(src && !src.startsWith("data:image/")))
    .map((src, index) => ({
      alt: "본문 이미지",
      createdAt: new Date().toISOString(),
      dataUrl: src,
      id: `inline-${index}`,
      thumbnailDataUrl: src,
    }));
}

function normalizeImages(value: unknown): MarketPostImage[] {
  return Array.isArray(value)
    ? value.map((image, index) => {
        const item = image as Partial<MarketPostImage>;
        return {
          alt: firstString(item.alt) ?? "게시글 이미지",
          createdAt: firstString(item.createdAt) ?? new Date().toISOString(),
          dataUrl: firstString(item.dataUrl) ?? "",
          id: firstString(item.id) ?? `image-${index}`,
          thumbnailDataUrl: firstString(item.thumbnailDataUrl) ?? firstString(item.dataUrl) ?? "",
        };
      }).filter((image) => image.dataUrl)
    : [];
}

function buildContactDisplays(data: Record<string, unknown>, fallback: MarketContactMethod): MarketContactDisplay[] {
  const values = typeof data.contactValues === "object" && data.contactValues ? data.contactValues as Record<string, unknown> : {};
  const methods = Array.isArray(data.contactMethods) ? data.contactMethods.map(String) : [fallback];
  return methods.map((method) => ({
    description: "",
    label: method === "phone" ? "Phone" : method === "kakao" ? "KakaoTalk" : method === "email" ? "Email" : "1:1",
    method: method as MarketContactMethod,
    value: firstString(values[method]) ?? "",
  }));
}

function firstString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parsePrice(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return null;
}

function formatPrice(priceType: MarketPriceType, priceAmount: number | null) {
  if (priceType === "free") return "무료나눔";
  if (priceType === "offer" || !priceAmount) return "가격제안";
  return `$${priceAmount.toLocaleString("en-NZ")}`;
}
