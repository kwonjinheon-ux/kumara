# Colink.nz Design System

Colink.nz UI must feel like a real product, not a rough HTML prototype. Every page
should be designed to a Figma-level standard before it is considered complete.

Core principle:

```text
Professional layout + clear hierarchy + polished interaction + restrained motion
```

## Design Bar

Every Colink.nz screen should meet these standards:

- Looks intentionally designed, not assembled from default browser styles.
- Has clear visual hierarchy for title, actions, content, helper text, and
  errors.
- Uses consistent spacing, typography, radius, shadows, and interaction states.
- Works on mobile, tablet, and desktop without text overlap.
- Includes subtle animation for state changes, hover, focus, loading, panels,
  dialogs, and form feedback.
- Avoids loud, distracting, or decorative animation that slows down community
  tasks.

## Visual Direction

Colink.nz should feel:

- Trustworthy
- Calm
- Modern
- Fast
- Local to New Zealand Korean users
- Practical rather than flashy

The UI should not feel like a landing page template. Colink.nz is a community
platform, so the design should prioritize scanning, posting, searching,
replying, managing, and trading.

## Layout Rules

- Use a spacing scale, not random margins.
- Use consistent max-widths for readable pages.
- Keep forms narrow enough to complete comfortably.
- Keep admin and board pages denser than marketing pages.
- Use full-width sections or direct layouts; avoid nesting cards inside cards.
- Use stable dimensions for buttons, filters, tabs, cards, image areas, and list
  rows so content does not jump.
- Every mobile layout must be checked for long Korean and English text.

Recommended spacing scale:

```css
--space-2xs: 4px;
--space-xs: 8px;
--space-sm: 12px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

## Typography

- Use system fonts unless a dedicated Korean/English font pair is selected.
- Do not scale font size directly with viewport width.
- Keep letter spacing at `0` for normal text.
- Use large display type only for true page heroes.
- Use compact headings inside forms, cards, dashboards, and panels.
- Error, helper, and hint text must be readable and calm.

Recommended type scale:

```css
--text-xs: 0.78rem;
--text-sm: 0.88rem;
--text-md: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.35rem;
--text-2xl: 1.75rem;
--text-3xl: 2.25rem;
```

## Color

- Keep the palette professional and restrained.
- Do not let the whole product become one color family.
- Primary color should identify Colink.nz actions.
- Accent colors should guide attention sparingly.
- Error, success, warning, and info states must be distinct and accessible.
- Text contrast must be strong enough for real use.

Base direction:

```css
--color-primary: #2388d9;
--color-primary-strong: #1169af;
--color-primary-soft: #e6f4ff;
--color-accent: #0ea5e9;
--color-bg: #f5f9fc;
--color-surface: #ffffff;
--color-text: #122033;
--color-muted: #617083;
--color-border: #d8e6f0;
--color-danger: #b42318;
--color-success: #147a45;
--color-warning: #b7791f;
--color-info: #2563eb;
```

## Components

All common components should have:

- Default state
- Hover state
- Focus-visible state
- Active/pressed state
- Disabled state
- Loading state when applicable
- Error state when applicable
- Mobile layout behavior

Required component polish:

- Buttons must have clear height, icon/text alignment, and loading behavior.
- Buttons must use the shared `Button` or `ButtonLink` component from
  `src/components/common/Button.tsx`.
- Primary buttons use a bright blue theme and professional graphics-tool style
  micro-interactions: subtle gradient shift, 1px highlight, gentle press state,
  and clean focus ring. Avoid busy shimmer patterns.
- Shared call-to-action buttons use a restrained diagonal shine on hover. The
  shine should pass once or twice like a polished graphics-tool interaction,
  not repeat as noisy stripes.
- Avoid heavy blue outer shadows around buttons. Prefer clean shape, contrast,
  a small highlight, and motion.
- Inputs must have labels, helper text support, errors, focus rings, and
  consistent heights.
- Selects and checkboxes must look intentional, not browser-default leftovers.
- Cards should use radius `8px` or less unless the design system changes.
- Modals should animate in, trap attention visually, and avoid layout shift.
- Toasts/alerts should be concise and dismissible.
- Tabs and filters should clearly show selected state.

## Animation Standard

Colink.nz should always include subtle animation where it improves clarity.

Use animation for:

- Button hover and press feedback
- Input focus rings
- Form validation messages
- Expanding optional sections
- Dropdowns and menus
- Modals and sheets
- Toasts and alerts
- Loading skeletons
- List item insert/remove transitions
- Saved/liked state changes

Avoid animation for:

- Long decorative loops
- Distracting background motion
- Critical flows where movement slows the user down
- Anything that causes layout shift or text overlap

Recommended motion tokens:

```css
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
--duration-fast: 120ms;
--duration-md: 180ms;
--duration-slow: 260ms;
```

Recommended patterns:

```css
.interactive {
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}

.interactive:hover {
  transform: translateY(-1px);
}

.panel-enter {
  animation: panel-enter var(--duration-slow) var(--ease-emphasized);
}

@keyframes panel-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 1ms !important;
  }
}
```

## Forms

Colink.nz forms must be pleasant and fast:

- Required fields are visually obvious.
- Optional sections are collapsible.
- Password requirements are shown before failure.
- Errors appear near the relevant control.
- Submit buttons show loading states.
- Successful submission should feel responsive.
- Long forms should be divided into clear groups.

For sign up:

- Keep required fields short.
- Optional profile fields should expand smoothly.
- Do not expose technical implementation text to users.
- Use friendly copy focused on trust and ease.

## Boards and Marketplace

Board and marketplace pages must be built for repeated use:

- Lists should be scannable.
- Price, location, date, status, and seller trust signals should align
  predictably.
- Filters should be fast to understand.
- Saved-post and search features should feel immediate.
- Empty states should offer useful next actions.
- Loading states should use skeletons, not blank pages.
- Feed cards should avoid repeated metadata. If comment count is shown next to
  the title, do not repeat `댓글` in another row.
- Price and status must have stable positions so cards do not visually jump
  between items.
- Mobile marketplace menus should use a floating hamburger trigger and an
  animated panel instead of wide horizontal scroll tabs.
- Boosted posts should use a small icon marker over the thumbnail, not a large
  badge that interferes with card layout.

## Rich Text and Images

Colink.nz marketplace writing should feel closer to a clean blog editor than a
plain textarea.

- Keep advanced HTML tools hidden behind an explicit toggle on mobile.
- Provide formatting, headings, lists, quotes, links, dividers, color swatches,
  and inline image insertion.
- Editor placeholder text disappears on focus and does not behave like saved
  content.
- Inline images can be resized by preset controls.
- Attached images support multiple upload, cover selection, per-image delete,
  and a clear `대표` overlay.
- Detail pages must not show internal image filenames or storage identifiers.

## Fast Interaction

User actions should feel immediate:

- Bookmark, vote, status change, comment submit, and chat send should update
  the UI optimistically.
- Server persistence can confirm or rollback after the visible state changes.
- Avoid mobile accordion structures that mount heavy content repeatedly.
- Keep scroll containers stable so message lists, galleries, and feed cards do
  not recalculate large layouts on every interaction.

## Admin UI

Admin screens should be denser and calmer:

- Tables must support search, filters, status, and bulk actions.
- Destructive actions require confirmation.
- Status badges must be easy to scan.
- Admin logs should be readable and searchable.
- Avoid decorative hero layouts in admin pages.

## Responsive Requirements

Before a screen is accepted:

- Check mobile width around 360px.
- Check Android Galaxy-class widths around 360px to 412px.
- Check large iPhone widths around 430px to 460px.
- Check tablet width around 768px.
- Check desktop width around 1280px.
- Confirm long Korean labels do not overflow buttons or cards.
- Confirm form labels, hints, and errors do not overlap.
- Confirm fixed-format elements have stable dimensions.
- Do not create device-specific mobile card structures unless there is a product reason; Galaxy and iPhone should share the same layout model.
- Keep browser text-size adjustment fixed at 100% so Android and iOS do not render different type scales for the same component.

## Marketplace Comment Threads

Comment threads must use one shared alignment model on mobile and desktop:

- The vertical thread line starts from the avatar center axis.
- Reply connector lines stop at the child avatar border and never pass through
  the circular avatar.
- Nested replies use smaller avatars in clear steps, but keep their connector
  line attached to the parent vertical line without a visible gap.
- Desktop and mobile can use different token values, but the geometry must
  follow the same center, border, and connector rules.

## My Page Navigation

My Page tabs must be URL-addressable and state-synchronized:

- Sidebar buttons, floating mobile menu buttons, and profile dropdown links use
  the same `/my-page?tab=` mapping.
- Chat deep links preserve `chatId` with `/my-page?tab=chat&chatId={id}`.
- Switching a tab must update the visible section and the URL without moving
  the page header or changing the shell layout width.

## Accessibility

- Use semantic HTML.
- Every input needs a label.
- Focus-visible states must be obvious.
- Do not rely on color alone for status.
- Respect `prefers-reduced-motion`.
- Maintain readable contrast for body text, muted text, and errors.
- Buttons and links must be keyboard reachable.

## Implementation Rule

When creating or editing a Colink.nz screen:

1. Build the real usable screen, not a placeholder.
2. Use the design tokens and component patterns.
3. Add subtle motion to interactive states.
4. Check mobile and desktop layout.
5. Remove developer-only text from user-facing UI.
6. Run typecheck/build before calling it done.

## Development Prompt

```text
Korin의 CSS와 UI 품질은 Figma로 전문 디자이너가 설계한 수준을 목표로 한다.

모든 화면은 단순 HTML 기본 스타일이 아니라 명확한 레이아웃, 일관된 간격, 전문적인 타이포그래피, 색상 시스템, 버튼/입력/카드/모달/탭/필터 상태 디자인을 갖춰야 한다.

사용자 화면에는 개발자용 문구나 내부 구현 설명을 노출하지 않는다.

모든 주요 상호작용에는 적당한 애니메이션을 포함한다. 버튼 hover/press, input focus, 오류 메시지, 선택 영역 펼침, 모달, 알림, 로딩, 찜 상태 변경 등에는 부드럽고 짧은 애니메이션을 적용한다.

애니메이션은 사용성을 높이는 목적이어야 하며 과하거나 산만하면 안 된다. prefers-reduced-motion을 반드시 고려한다.

모바일, 태블릿, 데스크톱에서 텍스트가 겹치거나 잘리지 않도록 확인하고, Korean/English 긴 문구도 자연스럽게 처리한다.

최종 결과물은 기능만 작동하는 수준이 아니라 실제 서비스로 배포해도 어색하지 않은 UI 완성도를 가져야 한다.
```
