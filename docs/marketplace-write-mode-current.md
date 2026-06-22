# Marketplace Write Mode Current Spec

Last updated: 2026-05-06

This document records the current `/marketplace/new` writing experience, the UI design decisions, the implemented behavior, and the next performance design needed to make post creation feel near-instant.

## Route

```text
/marketplace/new
```

Only logged-in users can access the write page. Logged-out users are redirected to `/auth/login`.

After a successful post creation, the client routes to:

```text
/marketplace/:postId
```

The detail page must never show a transient 404 immediately after post creation.

## Layout

The page uses a three-column marketplace composition on desktop.

```text
left marketplace menu | write form | right rail
```

Current behavior:

- The left marketplace menu follows scroll on desktop with a sticky shell.
- The right rail shows ad and popular-post surfaces.
- On mobile, the marketplace menu becomes a hamburger drawer.
- The write form remains the primary first-screen experience.

## Form Fields

Current form fields:

```text
boardType hidden value: 개인판매
title
itemCategory
tradeMethod
itemCondition
HTML content
inline content images
gallery images
coverImageId
priceType
priceAmount
region
contactMethods
contactPhoneNumber
contactKakaoTalkId
thumbnailDataUrl
```

The visible write mode starts as a personal-sale flow. Board type selection is not shown in the write form.

## HTML Editor

The body editor is a `contentEditable` rich editor. The toolbar is hidden by default and opens with `HTML 편집툴 보기`.

Supported editor actions:

```text
paragraph
H2
H3
bold
italic
underline
strikethrough
blockquote
unordered list
ordered list
left align
center align
link
unlink
horizontal rule
remove format
10 text colors
inline image insertion
```

Selection behavior:

- The editor saves the latest cursor selection.
- When a user clicks `이미지 넣기`, the selected image is inserted at the saved cursor position, not always at the end.
- The cursor moves after the inserted image so the user can keep writing.

## Inline Images

Inline images are inserted into the body as HTML figures.

Current behavior:

- The image appears where the cursor was blinking.
- Inserted images can be selected by clicking.
- Selected images can be resized with preset buttons: 작게, 보통, 크게, 전체.
- Inline images are wrapped in a resizable frame so the user can also adjust width with the mouse.
- Inline images also provide the list thumbnail source via a lightweight `thumbnailDataUrl`.

Implementation note:

- The original uploaded file is not sent as-is.
- The displayed image is resized client-side to a maximum of `1280px`.
- The list thumbnail is resized client-side to a maximum of `420px`.
- Both are encoded as JPEG data URLs.

## Gallery Images

Gallery images are managed below the editor.

Current behavior:

- Multiple images can be attached.
- A cover image can be selected.
- The selected cover image shows a `대표` badge.
- Images can be deleted individually.
- The image preview can be resized with the mouse from the bottom-right handle.
- The cover image is preferred for list thumbnails.

## Thumbnail Rules

List thumbnail source priority:

```text
1. cover gallery image thumbnail
2. inline editor image thumbnail
3. first image found in contentHtml
```

The list view intentionally uses compact image data. Detail pages load the full content HTML and gallery data.

## Contact Method UI

The contact section uses a modern Figma-style checked-option panel.

Visual design:

- White option rows inside a light panel.
- 8px option radius.
- Thin neutral border.
- Mint selected state.
- Subtle hover elevation.
- Native checkboxes for clarity.

Current options:

```text
Colink.nz 1:1 채팅
이메일
카카오톡
전화번호
```

At least one contact method must be selected. If phone or KakaoTalk is selected and the user profile lacks that value, the form shows a required inline input.

## Submit Progress

During post creation, a centered modal overlay appears.

Text:

```text
글을 등록중입니다
이미지와 내용을 서버에 안전하게 저장하고 있습니다.
```

Behavior:

- The progress UI uses `XMLHttpRequest.upload.onprogress`.
- Progress starts at form preparation, then tracks upload progress.
- The submit button also shows `등록 중 {progress}%`.
- On success, the modal remains until route transition begins.
- On failure, the modal closes and an error message is shown.

## Storage Behavior

Current MVP storage is JSON-file based:

```text
data/market-posts.json
```

Runtime safeguards:

- Posts are cached in memory to avoid repeated full-file reads.
- Cache tracks file `mtime`.
- If a detail page cannot find a post ID, it force-refreshes from disk before returning 404.
- Keyword notifications run after the post response path.

## Current Performance Work Already Implemented

Implemented improvements:

- Client-side image downscaling before upload.
- Separate compact thumbnail generation.
- Inline image original is not duplicated in the gallery payload.
- Memory cache for marketplace posts.
- File-change detection to prevent stale-cache 404.
- Keyword notification dispatch is moved off the critical response path.

## 10x Speed Redesign

The current MVP can be made much faster and more reliable by replacing JSON-file image/post persistence with a direct-upload architecture.

Target architecture:

```text
client
  -> request presigned upload URLs
  -> upload images directly to object storage in parallel
  -> submit compact post metadata and uploaded image keys
server
  -> validate metadata
  -> insert post row in DB transaction
  -> enqueue thumbnail/notification jobs
  -> return post ID immediately
```

Required backend changes:

- Move posts from JSON file to a database table.
- Store image object keys instead of base64 image data.
- Use S3/R2/GCS presigned URLs for image uploads.
- Create thumbnail variants asynchronously.
- Use a job queue for keyword notifications, image processing, and email.
- Add idempotency key for post creation to avoid duplicate posts after retries.

Required frontend changes:

- Upload selected images as files directly to object storage.
- Show per-image upload progress plus overall progress.
- Submit post metadata only after uploads complete.
- Keep optimistic transition to detail page using the returned post ID.
- Use small local previews while upload is running.

Expected speed impact:

- Request payload shrinks from large base64 HTML/JSON to compact metadata.
- Server avoids parsing and writing huge JSON documents.
- Parallel direct image uploads use browser/network concurrency.
- Post creation response becomes a small DB insert rather than a full file rewrite.

Primary success metric:

```text
P95 post creation response under 300ms after image upload completes.
No transient 404 after route transition.
```

## Files Involved

Core implementation:

```text
src/components/marketplace/MarketplacePostForm.tsx
src/lib/marketplace-store.ts
src/app/marketplace/new/page.tsx
src/app/marketplace/[postId]/page.tsx
src/styles/globals.css
src/types/marketplace.ts
src/config/marketplace.ts
```

Supporting marketplace components:

```text
src/components/marketplace/MarketplaceBoard.tsx
src/components/marketplace/MarketplaceSidebar.tsx
src/components/marketplace/MarketplaceImageGallery.tsx
src/components/marketplace/MarketplacePostActions.tsx
src/components/marketplace/MarketplaceComments.tsx
src/components/marketplace/MarketplaceChatButton.tsx
```
