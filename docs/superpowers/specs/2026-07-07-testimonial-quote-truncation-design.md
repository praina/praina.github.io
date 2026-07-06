# Testimonial quote truncation fix — design spec

## Problem

On the homepage Recommendations carousel (`.rec__card`), the quote text sits in a fixed-height box (`.rec__quote-wrap`, `height: calc(3 * 1.75 * 16px)` ≈ 84px / 3 lines, `overflow: hidden`). Testimonials run 200–1500+ characters, so most of the quote is invisible with no way to read the rest. A decorative `.rec__overflow-dots` element hints at truncation but isn't interactive. This is worse on mobile because the narrower column fits fewer words per line, so an even smaller fraction of the quote is visible in those same 3 lines.

## Decision

Keep the fixed-height clamp (uniform card height across the carousel, long or short quote — no layout jump between slides). Replace the decorative overflow-dots with:

1. **Native 3-line clamp with ellipsis** — use `-webkit-line-clamp: 3` (`display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden`) instead of a fixed pixel height. This gives a real `…` at the point of truncation instead of an abrupt cut mid-word, while still capping at 3 lines. Remove `.rec__overflow-dots` entirely — the ellipsis replaces it.
2. **"Read full on LinkedIn →" link** — a small text link directly under the quote (same position mocked in the brainstorm), shown **only when the quote is actually clamped** (i.e., the quote's scroll height exceeds its clamped height — detected once on load via JS, not CSS-only, since CSS can't tell whether truncation occurred). Short quotes that fit within 3 lines show no link.
3. **Link target** — reuses the same LinkedIn URL already used by each card's existing footer "View on LinkedIn →" button (`https://www.linkedin.com/in/prateek-raina/details/recommendations/`). No per-recommender profile links; no new data needed.
4. The existing footer "View on LinkedIn →" button is untouched — it stays where it is, for people who want to browse all recommendations regardless of truncation.

## Visual reference

Confirmed against `quote-fix-option-c-v3.html` mockup (long-quote variant), with two adjustments the user requested after review:
- Add a real `…` at the end of the clamped text (not just a fade-out) — addressed via native line-clamp above.
- Link copy is "Read full on LinkedIn →" (not "Read full recommendation on LinkedIn →" or a footer-relocated button).

## Implementation notes

- `js/main.js`: after the existing recommendations-carousel IIFE, for each `.rec__card`, compare `quoteEl.scrollHeight > quoteEl.clientHeight` and toggle a class (e.g. `is-truncated`) on the card, or on a wrapper, to show/hide the read-more link. Run once on load (quotes are static content, not resized dynamically) — no ResizeObserver needed, but rerun on `window.resize` if practical, since a truncation state can change between mobile/desktop widths.
- CSS: replace `.rec__quote` fixed-height rule with line-clamp; delete `.rec__overflow-dots` rule; add `.rec__readmore` link style (mono font, small caps, teal accent, underline) positioned between quote and `<hr class="rec__divider">`.
- HTML: add the read-more `<a>` element (hidden by default via CSS, e.g. `display:none` unless parent has `is-truncated`) to each `.rec__card` in `index.html`, right after `.rec__quote-wrap`.

## Out of scope (deferred)

- Per-recommender individual LinkedIn profile links (would require adding a URL field per testimonial — not requested).
- The other listed mobile issues (impact stats scroll length, skills chip wall) — explicitly deferred until this is done.
