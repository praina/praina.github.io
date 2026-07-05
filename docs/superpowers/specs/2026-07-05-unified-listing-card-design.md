# Unified Listing Card Design

## Problem

The three listing pages (`/case/`, `/prd/`, `/icebox/`) all sit on the same
`--c-bg-tint` background (established in a recent redesign), but use two
unrelated card components:

- `/case/` and `/prd/` already share one partial (`_includes/case-card.html`,
  class `.prd-list__row`) — a horizontal row: left accent bar, company/date
  meta, title, tldr, optional "Shipped" status badge (case studies only),
  optional "Sample" corner ribbon, trailing arrow.
- `/icebox/` uses a completely different partial (`_includes/icebox-card.html`,
  class `.icebox__card`) — a vertical card: top row (status pill + context),
  title, oneliner, a "why I dropped it" footer, optional "Full decision
  analysis" link. Visually and structurally unrelated to the row cards.

Icebox items carry more/different content than Case/PRD items (the reasoning
footer), and most Icebox items (2 of 3 today) have no link target at all —
so a byte-for-byte identical card shape across all three isn't the goal;
a consistent visual *family* is.

## Goals

1. All three listing pages read as one design system, not two.
2. Case/PRD rows keep their existing compact, scannable row shape (no
   regression — they already work well and share a partial).
3. Icebox cards adopt the same shell (border, radius, left accent bar,
   background/hover behavior, spacing rhythm, type scale) as Case/PRD,
   while keeping a taller body to fit their extra content.
4. Icebox's status ("Killed"/"Parked") reads as a status stamp, not plain
   metadata — placed inline beside the title, not merged into the meta
   line, not buried in the footer.
5. No regression to existing Case/PRD card behavior, hover states, sample
   ribbon, or status badge.

## Non-Goals

- No change to Case/PRD's existing row layout or fields.
- No forced identical DOM shape between row cards and Icebox cards — the
  "shared shell" is a set of consistent CSS properties (border, radius,
  accent bar, background, hover, spacing, typography scale), not a shared
  template structure.
- No change to which Icebox items have a real page (still only
  `youtube-extension.html` today).

## Design

### Shared shell (applies to both card families)

- Background: `--c-bg-tint` at rest (matches the page), `--c-surface`
  (white) on hover — already the pattern used by `.prd-list__row` and
  `.icebox__card` independently; kept as-is, now explicitly documented as
  the shared shell rule rather than two coincidentally-similar rules.
- Border: `1px solid var(--c-border)`, `border-radius: 4px` — already
  consistent between the two today; kept as-is.
- Left accent bar: `3px`–`4px` wide, `var(--c-accent)` (teal) by default.
  For Icebox cards specifically, the bar color follows status: red
  (`--c-status-kill`) for Killed, amber (`--c-status-park`) for Parked —
  matching the chip color (see below), so the bar and chip tell the same
  story at a glance without needing to read the chip text up close.
- Type scale: title uses `--f-display` (serif) at a consistent size range
  (~19–22px depending on card density), meta/eyebrow text uses `--f-mono`
  uppercase with `--c-ink-faint`, body/oneliner/tldr text uses `--f-body`
  at ~14px with `--c-ink-body`.
- Spacing rhythm: consistent internal padding (~20–28px) and gap between
  internal blocks (~8–14px) across both card types.
- Corner "Sample" ribbon: existing `.corner-ribbon` component, usable on
  either card family unchanged (front-matter `sample: true` already
  drives this for Case/PRD; available to Icebox items too if a future
  entry needs it).

### Case/PRD row card (`.prd-list__row`) — unchanged

No structural changes. It already conforms to the shared shell (border,
radius, accent bar, tint/surface hover, type scale). This card stays a
horizontal row: bar → (meta, title, tldr) → optional status badge →
arrow.

### Icebox card (`.icebox__card`) — restructured body, shared shell

New internal layout, still a taller vertical card (unlike the row, since
Icebox content doesn't fit a single line):

```
[ meta: context · date ]                          (mono, uppercase, ink-faint)
[ title ]                    [ status chip ]       (title + chip on one row,
                                                     center-aligned, chip
                                                     flex-shrink:0)
[ oneliner ]                                       (body text)
─────────────────────────────────────────────────
Why I dropped it · <why_dropped text>              (footer, existing pattern)
[ Full decision analysis → ]                        (only if item.link is set)
```

Key changes from today's `.icebox__card`:
- The status pill moves from its own top row (previously: status pill +
  context side by side) to sit inline beside the title, vertically
  centered against it (`align-items: center`, not `baseline`).
- The meta line above the title becomes context/date only — no status
  text mixed in.
- The left accent bar (new for Icebox — row cards already have one)
  colors by status: red for Killed, amber for Parked, giving a
  second, lower-effort visual cue that doesn't require reading the chip.
- Corner "Sample" ribbon behavior unchanged (already present, kept as-is
  for future sample Icebox entries).

### Field mapping (unchanged)

No front-matter field changes. `_icebox/*.html` items keep: `status`,
`context`, `title`, `oneliner`, `why_dropped`, `sample`, `link`. Only the
rendering in `_includes/icebox-card.html` and its CSS change.

## Testing

Since this is a CSS/template change with no content/data changes:

1. Build check — `bundle exec jekyll build` completes with no errors.
2. Manual visual pass — load `/case/`, `/prd/`, and `/icebox/`, confirm:
   - Case/PRD rows are visually unchanged from before this change.
   - Icebox's single real card (YouTube Escape & Explore, status Killed)
     shows the chip inline beside its title, center-aligned, with a red
     left accent bar.
   - Hover state on all three pages still transitions tint → surface
     background consistently.
3. Link check — `node scripts/verify/check-links.js` passes (no broken
   internal links).

## Open Risk

Only one Icebox item currently has `status: Killed`; the `Parked` status
color/chip combination (used by `report-config-portal.html`, front-matter
data-only, no rendered page) can't be visually verified end-to-end today
since that item was removed from the live collection per an earlier
cleanup pass. The CSS rule will still be written to support both statuses
correctly for whenever a new Parked item is added.
