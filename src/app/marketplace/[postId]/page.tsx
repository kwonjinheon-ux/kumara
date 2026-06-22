import Link from "next/link";
import { notFound } from "next/navigation";

import { LocalizedMarketValue } from "@/components/common/LocalizedMarketValue";
import { MarketplaceComments } from "@/components/marketplace/MarketplaceComments";
import { MarketplaceChatButton } from "@/components/marketplace/MarketplaceChatButton";
import { MarketplaceContactDropdown } from "@/components/marketplace/MarketplaceContactDropdown";
import { MarketplaceImageGallery } from "@/components/marketplace/MarketplaceImageGallery";
import { MarketplaceRightRail } from "@/components/marketplace/MarketplaceBoard";
import { MarketplacePostActions } from "@/components/marketplace/MarketplacePostActions";
import { MarketplaceRelatedPosts } from "@/components/marketplace/MarketplaceRelatedPosts";
import { MarketplaceSidebar } from "@/components/marketplace/MarketplaceSidebar";
import { MarketplaceTradeProgress } from "@/components/marketplace/MarketplaceTradeProgress";
import { hamiltonSuburbs } from "@/config/marketplace";
import { getFirebaseMarketPost, listFirebaseMarketPosts } from "@/lib/firebase-marketplace";
import { getWeeklyPopularMarketPosts } from "@/lib/marketplace-popular";
import type { MarketContactDisplay, MarketPostImage } from "@/types/marketplace";

const DEFAULT_AUTHOR_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='40' fill='%23fff7c2'/%3E%3Ccircle cx='40' cy='42' r='24' fill='%23ffdf66'/%3E%3Ccircle cx='31' cy='37' r='3.5' fill='%23111827'/%3E%3Ccircle cx='49' cy='37' r='3.5' fill='%23111827'/%3E%3Cpath d='M36 46h8l-4 5z' fill='%23f59e0b'/%3E%3Cpath d='M30 57c6 4 14 4 20 0' fill='none' stroke='%23111827' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E";

export default async function MarketplacePostPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams?: Promise<{ report?: string | string[] }>;
}) {
  const { postId } = await params;
  const query = await searchParams;
  const [post, marketPosts] = await Promise.all([
    getFirebaseMarketPost(postId),
    listFirebaseMarketPosts(),
  ]);

  if (!post) {
    notFound();
  }

  const initialNow = Date.now();
  const seller = { createdAt: post.createdAt };
  const sellerCompletedCount = getSellerCompletedCount(marketPosts, post.userId);
  const sellerGrade = getSellerGrade(sellerCompletedCount);
  const railPosts = getWeeklyPopularMarketPosts(marketPosts, {
    excludeId: post.id,
    limit: 5,
    now: initialNow,
  });
  const relatedPosts = marketPosts
    .filter((item) => item.id !== post.id && item.itemCategory === post.itemCategory)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const contentHtml = normalizeContentHtml(post.contentHtml);
  const contentImageSources = getContentImageSources(contentHtml);
  const shouldShowAttachmentGallery = contentImageSources.size === 0;
  const contentImages = shouldShowAttachmentGallery
    ? post.images.filter((image) =>
        shouldShowGalleryImage(image, contentImageSources, post.coverImageId, post.thumbnailDataUrl),
      )
    : [];
  const contactDisplays = ensureDefaultChatContact(post.contactDisplays);
  const sellerPostsHref = `/marketplace?menu=sell&seller=${encodeURIComponent(post.userId ?? post.authorNickname)}`;
  const isReportOpen = Array.isArray(query?.report) ? query.report[0] === "1" : query?.report === "1";
  const displayRegion = getDisplayRegion(post.region);

  return (
    <main className="market-page">
      <section className="market-layout market-detail-layout" aria-label="마켓플레이스 상세">
        <MarketplaceSidebar />

        <section className="market-main market-detail-main">
          <div className="market-mobile-menu">
            <MarketplaceSidebar mobileDrawer />
          </div>

          <article className="market-detail">
            <div className="market-detail__nav">
              <Link href="/marketplace?menu=sell">← 마켓플레이스</Link>
              {post.isOwner ? <Link href="/my-page">내 글 관리</Link> : null}
            </div>

            <header className="market-detail__header">
              <div>
                <h1>{post.title}</h1>
                <p className="market-detail-author-line">
                  <span className="market-detail-author-avatar" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src={post.authorProfileImageUrl ?? DEFAULT_AUTHOR_AVATAR} />
                  </span>
                  <span className="market-detail-author-name">{post.authorNickname}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                  <span aria-hidden="true">·</span>
                  <span>조회 {post.viewCount}</span>
                </p>
              </div>
            </header>

            {shouldShowAttachmentGallery ? (
              <MarketplaceImageGallery coverImageId={post.coverImageId} images={contentImages} />
            ) : null}

            <section className="market-detail__content">
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </section>

            <section className="market-detail-trade-summary" aria-label="거래 정보">
              <div className="market-detail-quick-info">
                <div className="market-detail-quick-info__item">
                  <span>가격</span>
                  <strong><LocalizedMarketValue value={post.priceLabel} /></strong>
                </div>
                <div className="market-detail-quick-info__item">
                  <span>거래방법</span>
                  <strong>{post.tradeMethod}</strong>
                </div>
                <div className="market-detail-quick-info__item">
                  <span>지역</span>
                  <strong>{displayRegion}</strong>
                </div>
                <MarketplaceContactDropdown
                  authorNickname={post.authorNickname}
                  contacts={contactDisplays}
                  isLoggedIn={false}
                  postId={post.id}
                  postTitle={post.title}
                />
                <MarketplaceTradeProgress initialPost={post} isLoggedIn={false} />
              </div>
            </section>

            <section className="market-detail-seller-card" aria-label="판매자 정보">
              <Link className="market-detail-seller-card__head" href={sellerPostsHref}>
                <span className="market-detail-seller-card__avatar" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={post.authorProfileImageUrl ?? DEFAULT_AUTHOR_AVATAR} />
                </span>
                <div>
                  <span>판매자</span>
                  <strong>{post.authorNickname}</strong>
                </div>
                <ChevronRightIcon className="market-detail-seller-card__chevron" />
              </Link>

              <dl className="market-detail-seller-stats">
                <div>
                  <dt>가입일</dt>
                  <dd>{formatJoinedMonth(seller?.createdAt ?? post.createdAt)}</dd>
                </div>
                <div>
                  <dt>거래 완료</dt>
                  <dd>{sellerCompletedCount.toLocaleString("ko-KR")}건</dd>
                </div>
                <div>
                  <dt>판매자 등급</dt>
                  <dd>{sellerGrade}</dd>
                </div>
              </dl>

              <div className="market-detail-seller-actions">
                <Link href={sellerPostsHref}>
                  <ListIcon />
                  다른 판매글 보기
                </Link>
                <Link href={`/marketplace/${encodeURIComponent(post.id)}?report=1`}>
                  <FlagIcon />
                  신고하기
                </Link>
              </div>
            </section>

            {isReportOpen ? (
              <section className="market-detail-report-panel" aria-label="신고 안내">
                <strong>신고하기</strong>
                <p>게시글 신고 기능을 준비 중입니다. 긴급한 문제는 관리자에게 문의해 주세요.</p>
                <Link href={`/marketplace/${encodeURIComponent(post.id)}`}>닫기</Link>
              </section>
            ) : null}

            <section className="market-detail-sale-contact" aria-label="판매 및 연락 정보">
              <div className="market-detail-contact-strip" aria-label="가격 및 연락 방식">
                <strong><LocalizedMarketValue value={post.priceLabel} /></strong>
                {contactDisplays.map((display) => (
                  <span key={display.method}>{getCompactContactLabel(display)}</span>
                ))}
              </div>

              <div className="market-detail-sale-contact__head">
                <span>판매/연락 정보</span>
                <strong>{post.title}</strong>
              </div>

              <div className="market-detail-info-grid market-detail-info-grid--summary" aria-label="거래 요약">
                <div>
                  <span>판매현황</span>
                  <strong className={`market-status ${getStatusClassName(post.status)}`}>{post.status}</strong>
                </div>
                <div>
                  <span>판매액</span>
                  <strong><LocalizedMarketValue value={post.priceLabel} /></strong>
                </div>
              </div>

              <div className="market-detail-meta-tags" aria-label="물건 정보">
                <span>{post.itemCondition}</span>
                <span>{post.tradeMethod}</span>
                <span>{displayRegion}</span>
              </div>

              <section className="market-detail-contact" aria-label="판매자 연락 방식">
                <div className="market-detail-contact__head">
                  <span>판매자 연락 방식</span>
                  <strong>{post.contactDisplays.map((display) => display.label).join(" · ")}</strong>
                  <p>판매자가 선택한 연락 방식입니다.</p>
                </div>
                <div className="market-detail-contact-list">
                  {contactDisplays.map((display) => (
                    <div className={`market-detail-contact-item method-${display.method}`} key={display.method}>
                      <span className="market-detail-contact-item__label">{getCompactContactLabel(display)}</span>
                      {display.method === "korin_chat" ? (
                        <MarketplaceChatButton
                          authorNickname={post.authorNickname}
                          isLoggedIn={false}
                          postId={post.id}
                          postTitle={post.title}
                        />
                      ) : (
                        <b>{display.value}</b>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </section>

            <MarketplacePostActions initialPost={post} isLoggedIn={false} />

            <MarketplaceComments
              currentUserId={null}
              currentUserNickname={null}
              currentUserProfileImageUrl={null}
              initialNow={initialNow}
              initialComments={post.comments}
              isLoggedIn={false}
              postAuthorId={post.userId}
              postId={post.id}
            />
            <MarketplaceRelatedPosts
              initialNow={initialNow}
              posts={relatedPosts}
            />
          </article>
        </section>

        <MarketplaceRightRail posts={railPosts} />
      </section>
    </main>
  );
}

function getStatusClassName(status: string) {
  if (status === "거래중" || status === "거래완료 대기") return "pending";
  if (status === "판매완료") return "done";
  return "selling";
}

function ensureDefaultChatContact(displays: MarketContactDisplay[]) {
  if (displays.some((display) => display.method === "korin_chat")) {
    return displays;
  }

  return [
    ...displays,
    {
      method: "korin_chat",
      label: "1:1",
      value: "",
      description: "",
    } satisfies MarketContactDisplay,
  ];
}

function getCompactContactLabel(display: MarketContactDisplay) {
  if (display.method === "korin_chat") {
    return "1:1";
  }

  return display.label;
}

function getDisplayRegion(region: string) {
  if (hamiltonSuburbs.includes(region)) {
    return `Hamilton · ${region}`;
  }

  return region;
}

function getSellerCompletedCount(
  posts: Array<{ id: string; status: string; userId: string | null }>,
  sellerId: string | null,
) {
  if (!sellerId) return 0;

  const completedPostIds = new Set(
    posts
      .filter((item) => item.userId === sellerId && item.status === "판매완료")
      .map((item) => item.id),
  );

  return completedPostIds.size;
}

function getSellerGrade(completedCount: number) {
  if (completedCount >= 30) return "Platinum";
  if (completedCount >= 15) return "Gold";
  if (completedCount >= 5) return "Silver";
  return "Bronze";
}

function ListIcon() {
  return (
    <svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
      <path d="M8 6h12M8 12h12M8 18h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
      <path
        d="M6 21V5.8c2.9-1.5 5.5 1.4 8.4-.1 1.2-.6 2.3-.8 3.6-.4v9.1c-1.3-.4-2.4-.2-3.6.4-2.9 1.5-5.5-1.4-8.4.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 24 24">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function formatJoinedMonth(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function normalizeContentHtml(value: string) {
  return value.replace(/<figcaption[\s\S]*?<\/figcaption>/gi, "");
}

function getContentImageSources(contentHtml: string) {
  return new Set(
    Array.from(contentHtml.matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1/gi))
      .map((match) => match[2])
      .filter(Boolean),
  );
}

function shouldShowGalleryImage(
  image: MarketPostImage,
  contentImageSources: Set<string>,
  coverImageId: string | null,
  thumbnailDataUrl: string | null,
) {
  if (contentImageSources.has(image.dataUrl)) return false;
  if (image.thumbnailDataUrl && contentImageSources.has(image.thumbnailDataUrl)) return false;

  const isExplicitCover = Boolean(coverImageId && image.id === coverImageId);
  if (isExplicitCover) return true;

  const isThumbnailOnlyImage = Boolean(
    contentImageSources.size &&
      thumbnailDataUrl &&
      (image.dataUrl === thumbnailDataUrl || image.thumbnailDataUrl === thumbnailDataUrl),
  );

  return !isThumbnailOnlyImage;
}
