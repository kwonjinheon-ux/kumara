# Marketplace Current State

Last updated: 2026-05-10

## Routes

- `/marketplace?menu=sell`: primary selling list.
- `/marketplace?menu=buy`: buying list.
- `/marketplace?menu=bookmarks`: bookmark management.
- `/marketplace/new`: listing creation.
- `/marketplace/[postId]`: detail page.

## Navigation

- Navbar stays above marketplace filters and floating menus.
- Desktop navbar shows `logo/colink_logo.png` to the left of `Colink.nz`.
- Mobile navbar keeps the text-only brand treatment and compact profile/notification buttons.
- Profile images are fixed-size circular images with centered cover fit.

## Marketplace List

- Filter bar supports region, item category, status, and sort.
- Distance filter supports item filtering by the signed-in user's profile location.
- Mobile filters are horizontally scrollable without visible scrollbars.
- `매물등록` remains visible as the fixed action at the right side of the filter area.
- List cards use a unified layout across sell, bookmark, and related-post contexts.
- Mobile list cards keep the same three-column structure across iPhone and Android Galaxy widths.
- List cards show approximate distance from the user's profile location to the listing region when available.
- List cards reveal in order with a staggered animation when the list loads.
- Metadata tags use light gray pill styling.
- Status pills share one consistent design for `판매중`, `거래중`, and `판매완료`.
- Sold items show a grayscale thumbnail overlay and `판매완료`.
- Items without images show text-only placeholder styling.
- Mobile list keeps view counts inline with author/time metadata.

## Bookmark And Owner Management

- Bookmark management has selection mode, select all, and delete actions.
- Owner sell management follows the same management layout pattern.
- Completed items block edit/comment flows where applicable.

## Listing Form

- HTML editor image insertion supports inline body images and thumbnail extraction.
- Inline body images are not duplicated as a large attachment gallery on detail pages.
- Upload/register flow displays progress feedback while submitting.
- Price, currency, and trade region are grouped into one section.
- Contact method controls use a simplified checkbox-style interaction.

## Detail Page

- Detail pages use the same left/right marketplace layout as the list page.
- Mobile detail content has horizontal padding so content does not touch viewport edges.
- The title, author line, trade summary, contact dropdown, actions, comments, and related list are arranged in a single content flow.
- Trade summary shows price, trade method, region, and contact method dropdown.
- Trade summary shows approximate distance from the signed-in user's profile location when the app can map both locations.
- Owner edit/delete/bump controls use the same light region-info tone: white background, pale blue border, dark text.
- Detail title, body, and comment font sizes are back on the original baseline.
- Contact actions:
  - Chat opens Colink.nz 1:1 chat.
  - Email opens mail compose.
  - Phone opens calling on supported mobile devices.
  - Kakao copies the ID.
- Detail action metadata removes extra icons for view/comment text.

## Comments

- Enter submits comments unless the user is composing text or holding Shift.
- Newly added comments remain in their final chronological/thread position.
- Comment input has a focused color sweep animation.
- Comment author badge appears for post-author comments.
- Reply threads support 댓글, 대댓글, and 대대댓글.
- Thread lines follow a YouTube-style relationship model:
  - parent avatar bottom center connects downward,
  - child avatar left center receives a curved line,
  - nested replies repeat the same parent-to-child pattern,
  - the line is intentionally light and subtle.
- The `답글 숨기기` toggle no longer has an extra leading connector line.

## Related Posts

- Detail pages show posts from the same item category below comments.
- Related posts use the exact same `market-post-list` and `market-card` layout as the main marketplace list.
- Related posts show 10 items initially.
- If more than 10 related posts exist, a `더보기` button appears at the bottom.
- Each `더보기` click reveals 10 more items.
- Navigating to another detail page resets the related list back to 10.

## Performance Design

- List-item conversion no longer performs full comment transformation and then discards it.
- Detail pages load the selected post and marketplace list in parallel after user lookup.
- Detail author lookup is skipped when the post already has the profile image and required contact values.
- Marketplace list and detail payloads externalize post, author, comment, thumbnail, and inline content images through `/api/marketplace/posts/[postId]/images/[imageId]`.
- Image responses use long-lived public immutable cache headers.
- The in-memory post store keeps sorted posts, post maps, and public list items cached until writes invalidate them.
- List responses strip heavy fields:
  - comments,
  - full HTML body,
  - original image arrays,
  - oversized thumbnail data.
- Server-rendered HTML no longer contains `data:image` payloads for marketplace list/detail pages.
- View-count updates are deferred to avoid blocking the first render.
- Writes use queued atomic persistence to reduce blocking and avoid corrupted JSON writes.

## Performance Check

Command: `npm.cmd run perf:marketplace`

- Marketplace list: min 428ms, p50 444ms, p95 504ms, max 587ms.
- Marketplace detail: min 389ms, p50 431ms, p95 475ms, max 511ms.
- 2026-05-10 optimized check with 12 iterations / 3 warmups:
  - Marketplace list: min 34ms, p50 37ms, p95 67ms, max 67ms.
  - Marketplace detail: min 74ms, p50 78ms, p95 92ms, max 92ms.
  - `/marketplace?menu=sell` HTML: about 107KB, `data:image` count 0.
  - `/marketplace/[postId]` HTML: about 91KB, `data:image` count 0.

Observed improvement from this pass:

- Detail p95 improved from 617ms to 475ms after reducing sequential and unnecessary work.
- List conversion avoids full comment transformation for every row, which reduces CPU work as comment volume grows.

## Current Constraints

- The marketplace still uses JSON file persistence, so absolute 20x speed guarantees depend on disk speed, data volume, and image payload size.
- The current speed work keeps all existing features intact while removing avoidable CPU work and sequential waits.
- Current image externalization keeps edit pages on original data where required, while read-only list/detail pages use lightweight URLs.
- Further large speed gains should come from moving posts, comments, and images into indexed storage and storing original images outside JSON.
