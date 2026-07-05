# Single Unified Listing Card Design

## Problem

An earlier attempt ("shared shell, flexible body" — see
`2026-07-05-unified-listing-card-design.md`) kept `.prd-list__row` (Case/PRD)
and `.icebox__card` (Icebox) as two separate components, only aligning their
surface-level styling (border, radius, background/hover, accent-bar color).
Even after several follow-up fixes (accent-bar color-by-status, chip/title
alignment, card-width mismatch), the user found the result still visibly
inconsistent — two different components dressed similarly is not the same
as one component. This spec replaces that approach entirely: **one single
card partial, used identically on `/case/`, `/prd/`, and `/icebox/`,
discarding both existing card partials.**

## Goals

1. One card component, one set of CSS rules, used by all three listing
   pages — not two components with matching styles.
2. Handles the real differences in content gracefully, without looking
   inconsistent when a field is absent:
   - Icebox's extra "why I dropped it" reasoning block (Case/PRD don't have
     this).
   - Icebox's partial clickability (2 of 3 items have no destination page
     at all; Case/PRD always link somewhere).
   - A status concept that means different things per type ("Shipped" for
     case studies vs. "Killed"/"Parked" for Icebox; PRDs have no status at
     all).
3. Calmer resting state: accent color appears only on interaction (hover on
   desktop), not as a permanent stripe on every card.
4. Consistent, device-appropriate interaction cues: no visible "click here"
   text or arrow on desktop (background shift + hover accent bar carry the
   affordance); a small static arrow on mobile/touch only where a real link
   exists, since hover doesn't exist on touch devices.

## Non-Goals

- No change to detail page templates/layouts (this is listing-page cards
  only).
- No forced front-matter field renames across collections — the template
  tolerates the small existing naming differences (see Field Mapping)
  rather than requiring a data migration.

## Design

### Card anatomy (single component, used everywhere)

```
[ meta text ]                                          (mono, uppercase, ink-faint)
[ title ]  [ status chip ]                             (title + chip on one row;
                                                          chip sits directly after
                                                          the title text, not
                                                          stretched to the card edge;
                                                          only rendered if a status
                                                          exists)
[ summary text ]                                        (body text, one line/tldr)
─────────────────────────────────────────────────       (only if a "detail" block exists)
[ detail label · detail text ]                          (e.g. "Why I dropped it · ...")
```

- No visible action text or arrow on desktop, ever (removed entirely — not
  hidden-until-hover).
- Desktop hover: background shifts `--c-bg` → `--c-surface` (unchanged from
  today), and a 3px left accent bar fades in, colored to match the card's
  status (or teal if no status/unrecognized status).
- Mobile (`max-width: 640px`, matching the site's existing breakpoint):
  hover doesn't exist, so instead a small static arrow (`→`) appears
  bottom-right of the card, but **only on cards that have a real link
  target** — cards without one (2 of today's 3 Icebox items) show no arrow
  on any screen size. The arrow's color matches the card's status color
  (or teal default) — same color language as the desktop hover accent bar,
  just always-visible instead of hover-revealed, since mobile has no hover
  state to reveal it with.
- Whole-card clickability: if the item has a link target, the entire card
  is wrapped in `<a>`; if not, it's a plain `<div>` — no dead links, no
  half-clickable cards.

### Status color tokens (updated)

```
--c-accent:       #2BC4A2   (unchanged — default/fallback, and "Shipped")
--c-status-kill:  #E5484D   (was #9A4A2E — now a clearer, brighter red)
--c-status-park:  #D9932B   (was #1B4F72 blue — now amber/mustard)
--c-status-later: unchanged (not addressed this round; no current usage
                   to validate against)
```

**Ripple effect, explicitly accepted by the user:** these are shared tokens
already used outside the listing cards — the "Approach comparison" decision
matrix on the Icebox detail page (`icebox/youtube-extension.html`, classes
`.matrix__killed` etc.) and that same page's own status badge both use
`--c-status-kill`. Updating the token updates those too. This is
intentional (single source of truth), not a side effect to work around.

**Default/fallback behavior:** any card with no status field, or a status
value that doesn't match a known token (i.e. not "Killed" or "Parked"),
falls back to the default teal accent — this covers "Shipped" (Case
studies) and PRDs (no status field at all) under one rule, rather than
needing a separate "Shipped" color.

### Field mapping (no data changes required)

The one shared template accepts small naming differences between
collections via fallback logic, rather than requiring front-matter renames:

| Card slot | Case studies | PRDs | Icebox |
|---|---|---|---|
| Meta line | `company` + `date_range` | `company` + `date_range` | `context` (already a combined string, e.g. "Personal Project · 2025") |
| Title | `title` | `title` | `title` |
| Status chip | `status` ("Shipped") | *(none)* | `status` ("Killed"/"Parked") |
| Summary | `tldr` | `tldr` | `oneliner` |
| Detail block | *(none)* | *(none)* | `why_dropped` |
| Link target | `permalink` (via Jekyll's `item.url`) | `permalink` (via `item.url`) | `link` (optional, may be blank) |
| Sample ribbon | `sample` | `sample` | `sample` |

Template logic: meta line renders `company`/`date_range` if present,
otherwise falls back to `context`. Summary renders `tldr` if present,
otherwise `oneliner`. Detail block renders only if `why_dropped` is set.
Link wrapper renders only if a URL is resolvable (`item.url` for
case_studies/prds collections is always present; `item.link` for icebox is
sometimes blank).

## File Structure

- **Delete:** `_includes/case-card.html`, `_includes/icebox-card.html`
- **Create:** `_includes/listing-card.html` — the one shared partial
- **Modify:** `case/index.html`, `prd/index.html`, `icebox/index.html` —
  all three loop over their collection using the same
  `{% include listing-card.html item=item %}` call
- **Modify:** `css/style.css` — remove `.prd-list__row*` and
  `.icebox__card*` rule blocks, add one new `.listing-card*` rule block;
  update `--c-status-kill`/`--c-status-park` token values

## Testing

1. Build check — `jekyll build` completes with no errors.
2. Manual visual pass — `/case/`, `/prd/`, `/icebox/` all render cards from
   the same component; confirm meta/status/summary/detail/link render
   correctly per the field mapping table above for at least one real item
   from each collection.
3. Confirm mobile breakpoint (resize to ≤640px): arrow appears only on
   cards with a real link target.
4. Confirm desktop hover: accent bar fades in colored by status, no arrow
   appears at any point.
5. Confirm the Icebox detail page's own status badge and "Approach
   comparison" table picked up the new red/amber colors (expected ripple,
   not a regression).
6. Link check — `node scripts/verify/check-links.js` passes.

## Open Risk

Only one live Icebox item has `status: Parked`... actually zero — the only
live Icebox item is `status: Killed`. The Parked color/behavior can only be
verified by inspecting the CSS rule directly (as in the prior round), not
by viewing a live Parked card, until a new Parked entry is added to the
collection.
