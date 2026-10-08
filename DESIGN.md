# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

A calm, light "operator console": near-white surfaces, deep slate text, one confident indigo accent, and four semantic status colors (pending/running/done/failed) as the visual backbone — quiet like a banking app, precise like Linear.

## Colors

- `--color-bg`: **#F6F7F9**
- `--color-surface`: **#FFFFFF**
- `--color-surfaceMuted`: **#F1F3F6**
- `--color-fg`: **#16181D**
- `--color-fgMuted`: **#6B7280**
- `--color-border`: **#E4E7EC**
- `--color-borderStrong`: **#CBD2DC**
- `--color-accent`: **#4F46E5**
- `--color-accentHover`: **#4338CA**
- `--color-accentActive`: **#3730A3**
- `--color-accentSubtle`: **#EEF0FE**
- `--color-focusRing`: **#4F46E5**
- `--color-statusPendingFg`: **#92400E**
- `--color-statusPendingBg`: **#FEF3C7**
- `--color-statusRunningFg`: **#1D4ED8**
- `--color-statusRunningBg`: **#DBEAFE**
- `--color-statusDoneFg`: **#047857**
- `--color-statusDoneBg`: **#D1FAE5**
- `--color-statusFailedFg`: **#B91C1C**
- `--color-statusFailedBg`: **#FEE2E2**
- `--color-danger`: **#B91C1C**
- `--color-dangerBg`: **#FEF2F2**

## Typography

- `font_family`: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif
- `font_family_mono`: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace
- `heading_weight`: 600
- `body_weight`: 400
- `size_scale`: 12px/14px/16px/20px/24px/32px
- `line_height`: 1.5 body, 1.25 headings
- `letter_spacing`: 0 for body, -0.01em for 24px and up

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px

## Border-Radii

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-pill`: 999px

## Components

### Button

Primary action button. Height 44px (mobile tap target), padding 12px/20px, radius md (8px), bg=accent #4F46E5, text #FFFFFF 16px/600, no border, 1px transparent outline placeholder. default: bg accent. hover: bg accentHover #4338CA, transition 120ms ease-out. active: bg accentActive #3730A3, transform translateY(1px). disabled: bg accent at opacity 0.45, text #FFFFFF at opacity 0.9, cursor not-allowed, transform none, no hover change. focus-visible: 2px focusRing outline offset 2px. Loading state (submit in flight): same size, label replaced by 'Creating…', bg accentActive, pointer-events none, aria-busy=true. Secondary button: bg surface, 1px border borderStrong, text fg, hover bg surfaceMuted. Only one primary button per screen.

### StatusBadge

Pill (radius pill), height 24px, padding 2px/10px, 12px/600 uppercase-tracking 0.04em, 1px border in the matching fg color at 30% alpha. pending: fg statusPendingFg on statusPendingBg, label 'PENDING'. running: fg statusRunningFg on statusRunningBg, label 'RUNNING', plus a 6px dot with a 1.2s opacity pulse (disabled under prefers-reduced-motion). done: fg statusDoneFg on statusDoneBg, label 'DONE'. failed: fg statusFailedFg on statusFailedBg, label 'FAILED'. Color is never the only signal — the label text always carries the state.

### JobForm

Card, bg surface, radius lg, 1px border border, padding 24px, max-width 720px, vertical stack with 16px gaps. Textarea: label 'Text' 14px/600 fg; control min-height 120px, padding 12px, radius md, 1px border borderStrong, bg surface, 16px body; focus-visible border accent + 2px focusRing outline offset 0; placeholder fgMuted. Select: label 'Analysis', native select, height 44px, same border/radius/focus as textarea, options 'Word count' / 'Top words' / 'Reading time'. Pristine state is neutral: no red borders, no error text, no error icon on first render (AC-02). After a failed submit: 1px border danger, error text 14px danger below the field with a 16px warning glyph, and aria-invalid + aria-describedby wired. Error clears on next edit. Submit button is the primary Button, right-aligned, 12px above.

### JobList

Vertical stack, 12px gaps, full container width, ordered newest first. Each JobCard: bg surface, radius lg, 1px border border, padding 16px/20px, subtle shadow 0 1px 2px rgba(22,24,29,0.04). Header row: left = job id as '#{id}' in font_family_mono 13px fgMuted, then analysis type as 13px fgMuted '· word_count'; right = StatusBadge. Second row: one-line preview of the submitted text, 14px fgMuted, single line with text-overflow ellipsis, title attribute carries the full text. Third row (only when done/failed): the result block or error text, separated by a 1px top border and 12px padding-top. Border of the running card is 1px accent at 35% alpha so the active item is findable while scanning.

### ResultBlock

One renderer per analysis type, all inside JobsList card at 14px fg. word_count: the numeral in font_family_mono 24px/600 fg followed by ' words' in 14px fgMuted — format '12 words', singular '1 word'. reading_time: '≈ 2 min 30 s' in font_family_mono 20px/600 fg, with the underlying basis as 13px fgMuted underneath: 'based on 500 words at 200 words/min'. top_words: a compact ranked list, max 10 rows, each row = rank 13px fgMuted right-aligned 24px wide, the word in 14px/600 fg (mono for the word itself), a horizontal bar in accentSubtle with an accent fill proportional to the maximum count (min 4px width, 8px tall, radius pill), and the count in font_family_mono 13px fgMuted right-aligned. Same count formatting everywhere: plain integer, no thousands separator below 10000, otherwise thin space.

### PollIndicator

Sits in the app header, right side, next to a manual refresh icon button (36px, radius md, hover surfaceMuted, aria-label 'Refresh now'). States: 'Live · updated 12:04:31 UTC' with a 6px statusDone-colored dot when the last poll succeeded; 'Reconnecting…' with a 6px statusPending dot when a poll is in flight after a failure. Text 12px fgMuted. The last-updated timestamp uses the single global timestamp format.

### EmptyState

Shown in place of the list when there are zero jobs. Centered block, max-width 400px, padding 48px 24px. A 48px line-art glyph (empty tray, 1.5px stroke, borderStrong), heading 16px/600 fg 'No jobs yet', body 14px fgMuted 'Submit a text above and pick an analysis type — new jobs appear here and update automatically.' Ends with a text link in accent pointing focus back to the form textarea.

### ErrorBanner

Full-width banner above the list, bg dangerBg, 1px border danger at 30% alpha, radius md, padding 12px/16px, 14px text danger, left 16px warning glyph. Two sources, never a silently empty list (AC-15): (1) connectivity — 'Cannot reach the API at {apiBaseUrl}. Retrying every 3 s.' plus a secondary 'Retry now' button; (2) rejected submission — the API's uniform error body message rendered verbatim, no field mapping special cases. The banner is dismissible via a 36px × button; a dismissed connectivity banner returns automatically after the next failed poll.

### AppHeader

Height 64px, bg surface, 1px bottom border border, contents inside the same max-width container as the page. Left: product wordmark 'Job Runner' 18px/600 fg. Right: PollIndicator. Sticky at top with z-index 10 so the live state stays visible while scrolling the list.

### SkeletonRow

Used only for the very first load, before any data has arrived. Same geometry as JobCard (radius lg, 1px border, 16px/20px padding, three stacked bars of 12px/14px/14px height, radius sm, bg surfaceMuted) with a 1.4s shimmer. Replaced by real content on first successful poll; subsequent polls never swap content for skeletons, only update in place (AC-14).

## Layout Principles

- Single-column layout. Page container max-width 960px, centered, horizontal padding 24px (16px below 640px). Form sits on top, list below, 32px vertical gap.
- Breakpoints: mobile < 640px (single column, full-width controls, list cards stack their header row so StatusBadge moves under the id), tablet 640–1023px, desktop >= 1024px. The app is phone-usable first; the polling indicator stays visible at every size.
- Spacing uses the scale only: 4/8/12/16/24/32/48px. Inside a card 8–12px, between cards 12px, between sections 32px, page top/bottom 48px desktop / 24px mobile.
- Timestamp format — ONE format for every timestamp in the product, API payloads included: ISO 8601 in UTC, 'YYYY-MM-DDTHH:MM:SSZ'. In the UI rendered as 'YYYY-MM-DD HH:MM:SS UTC' (mono, 13px). Relative times ('3 s ago') are allowed only next to a rendered absolute timestamp, never as a replacement.
- Number of words and occurrences: plain integer with no thousands separator under 10000, thin space above; singular 'word' at 1 word. Never a bare decimal.
- Reading time: always the form '≈ {m} min {s} s' with the seconds segment omitted when 0 ('≈ 3 min'), never an unrounded decimal. The estimate's basis (word count and words-per-minute) is always shown underneath so the number is verifiable.
- Top words list: at most 10 rows, descending by count, ties broken alphabetically ascending, so two runs of the same job look identical.
- Colors are never the sole carrier of meaning: every status also has its uppercase text label, every error its message, every empty state its sentence.
- Cards over tables at every breakpoint — a job has mixed content (text preview, status, variable result shape) and must not depend on column width.
- Focus is never removed: every interactive element has a visible 2px focusRing outline with 2px offset; keyboard order is form → submit → refresh → card content.
- Motion is limited to state change (status badge pulse, hover/active, shimmer) at 120–200ms ease-out; no entrance animations on list items, since the list re-renders every 3 s.
