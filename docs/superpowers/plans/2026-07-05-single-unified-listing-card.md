# Single Unified Listing Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two separate listing-card components (`_includes/case-card.html` / `.prd-list__row`, and `_includes/icebox-card.html` / `.icebox__card`) with one shared `_includes/listing-card.html` partial and one `.listing-card*` CSS block, used identically by `/case/`, `/prd/`, and `/icebox/`.

**Architecture:** One Liquid partial handles the small field-naming differences between collections (`company`+`date_range` vs `context`; `tldr` vs `oneliner`) via fallback logic, and conditionally renders slots that only some items need (status chip, extra detail block, link wrapper). One CSS component replaces both existing ones. Page container classes (`.prd-list__outer`, `.prd-list__section`, `.icebox__outer`, `.icebox__section`, `.icebox__grid`) are untouched — only the card-level classes change.

**Tech Stack:** Jekyll (Liquid templates), plain CSS, existing site design tokens in `css/style.css`.

---

## Before You Start

Work happens directly on `main` (explicitly authorized by the user). Commit locally after each task; **do not push** — the user pushes explicitly when ready. Working directory: `C:\Users\prate\AI Projects\praina.github.io`. Use PowerShell for all commands — the Bash tool has been unreliable in this environment (silently produces no output sometimes); retry via PowerShell if that happens.

## Reference: Current State (facts used throughout this plan)

**Current `_includes/case-card.html`** (used by both `/case/` and `/prd/` today):
```html
<a href="{{ include.item.url }}" class="prd-list__row{% if include.item.sample %} has-ribbon{% endif %}" data-reveal>
  {% if include.item.sample %}<div class="corner-ribbon">Sample</div>{% endif %}
  <div class="prd-list__bar"></div>
  <div class="prd-list__row-content">
    <div class="prd-list__row-co">{{ include.item.company }} · {{ include.item.date_range }}</div>
    <div class="prd-list__row-title">{{ include.item.title }}</div>
    <p class="prd-list__row-tldr">{{ include.item.tldr }}</p>
  </div>
  {% if include.item.status %}<span class="prd-list__row-status">{{ include.item.status }}</span>{% endif %}
  <span class="prd-list__row-arrow">→</span>
</a>
```

**Current `_includes/icebox-card.html`:**
```html
<div class="icebox__card{% if include.item.sample %} has-ribbon{% endif %} icebox__card--{{ include.item.status | downcase }}" data-reveal>
  {% if include.item.sample %}<div class="corner-ribbon">Sample</div>{% endif %}
  <div class="icebox__context">{{ include.item.context }}</div>
  <div class="icebox__card-title-row">
    <h2 class="icebox__card-title">{{ include.item.title }}</h2>
    <span class="icebox__status icebox__status--{{ include.item.status | downcase }}">{{ include.item.status }}</span>
  </div>
  <p class="icebox__card-oneliner">{{ include.item.oneliner }}</p>
  <div class="icebox__card-footer">
    <span class="icebox__why-label">Why I dropped it · </span>{{ include.item.why_dropped }}
  </div>
  {% if include.item.link %}<a href="{{ include.item.link }}" class="icebox__card-link">Full decision analysis →</a>{% endif %}
</div>
```

**Current listing pages call these via:**
- `case/index.html:18` — `{% include case-card.html item=item %}` inside `.prd-list__rows`
- `prd/index.html:18` — same include, same wrapper
- `icebox/index.html:18` — `{% include icebox-card.html item=item %}` inside `.icebox__grid`

**Current design tokens** (`css/style.css:19-20`, to be changed in Task 1):
```css
--c-status-kill:  #9A4A2E;
--c-status-park:  #1B4F72;
```

**Current CSS blocks to be deleted** (Task 3):
- `css/style.css:616-656` — `.prd-list__rows` through `.prd-list__row-arrow` (the row card)
- `css/style.css:894-921` — `.icebox__grid` through `.icebox__why-label` (the icebox card) — note `.icebox__grid`'s single rule (`display: grid; grid-template-columns: 1fr; gap: 20px;`) is **kept**, only re-homed; everything else in this range is deleted
- `css/style.css:1050-1057` — `.icebox__card-link` and its hover rule (the "Full decision analysis →" text link — removed entirely per the new no-visible-arrow-on-desktop design)

**Confirmed still-shared, unchanged rules** (used by the new component too, do not touch):
- `.has-ribbon` / `.corner-ribbon` (`css/style.css:947` onward) — the "Sample" corner ribbon
- `--t-bar: .3s` (`css/style.css:41`) — transition timing already used for bar/accent animations
- `--c-accent`, `--c-status-later` — unchanged in this plan

**Mobile breakpoint already established elsewhere on the site:** `@media (max-width: 640px)` (e.g. `css/style.css:603`) — reuse this exact breakpoint for the new component's mobile arrow rule, don't invent a new one.

---

### Task 1: Update status color tokens

**Files:**
- Modify: `css/style.css:19-20`

- [ ] **Step 1: Replace the token values**

Find:
```css
--c-status-kill:  #9A4A2E;
--c-status-park:  #1B4F72;
```

Replace with:
```css
--c-status-kill:  #E5484D;
--c-status-park:  #D9932B;
```

(`--c-status-later: #3F6E4B;` on the next line is unchanged — leave it exactly as-is.)

- [ ] **Step 2: Confirm the ripple to other usages is expected, not a bug**

Run:
```powershell
Select-String -Path "css\style.css" -Pattern "c-status-kill|c-status-park"
```
Expected: multiple matches, including `.matrix__killed`, `.icebox-detail__kill-label` or similar rules outside the listing-card component (these live on `icebox/youtube-extension.html`'s "Approach comparison" table and its own status badge). This is intentional — the user explicitly approved this ripple during design review. Do not try to "fix" or isolate it; just confirm the matches exist so you understand the blast radius.

- [ ] **Step 3: Commit**

```powershell
git add css/style.css
git commit -m "Update status color tokens: brighter red for Killed, amber for Parked"
```

---

### Task 2: Create the shared `_includes/listing-card.html` partial

**Files:**
- Create: `_includes/listing-card.html`

- [ ] **Step 1: Write the new partial**

```html
{% assign item = include.item %}
{% assign item_url = item.url | default: item.link %}
{% assign meta = item.company | default: item.context %}
{% assign summary = item.tldr | default: item.oneliner %}
{% assign status_key = item.status | downcase %}

{% if item_url %}
<a href="{{ item_url }}" class="listing-card listing-card--{{ status_key }}{% if item.sample %} has-ribbon{% endif %}" data-reveal>
{% else %}
<div class="listing-card listing-card--{{ status_key }}{% if item.sample %} has-ribbon{% endif %}" data-reveal>
{% endif %}
  {% if item.sample %}<div class="corner-ribbon">Sample</div>{% endif %}
  <div class="listing-card__meta">
    {% if item.company %}{{ item.company }} · {{ item.date_range }}{% else %}{{ meta }}{% endif %}
  </div>
  <div class="listing-card__title-row">
    <h2 class="listing-card__title">{{ item.title }}</h2>
    {% if item.status %}<span class="listing-card__status listing-card__status--{{ status_key }}">{{ item.status }}</span>{% endif %}
  </div>
  <p class="listing-card__summary">{{ summary }}</p>
  {% if item.why_dropped %}
  <div class="listing-card__detail">
    <span class="listing-card__detail-label">Why I dropped it · </span>{{ item.why_dropped }}
  </div>
  {% endif %}
  {% if item_url %}<span class="listing-card__arrow-mobile">→</span>{% endif %}
{% if item_url %}
</a>
{% else %}
</div>
{% endif %}
```

Notes on why this is written this way (for your understanding, not something to change):
- `item_url` resolves to `item.url` (always present for `case_studies`/`prds` collection items via Jekyll's automatic collection URL) or falls back to `item.link` (Icebox's manually-set, sometimes-blank field). This one variable drives both which wrapper tag is used (`<a>` vs `<div>`) and whether the mobile arrow renders.
- `status_key` is lowercased once and reused for both the outer card's status modifier class (drives the accent-bar hover color) and the status chip's own modifier class (drives its text/border color) — avoids calling the `| downcase` filter twice.
- `meta` and `summary` are computed with Liquid's `default` filter as a first attempt, but the actual per-field rendering below the `title-row` still needs the two-part "company · date_range" format specifically for Case/PRD items (a single combined field wouldn't have the "·" separator), so the meta line has its own inline `{% if item.company %}...{% else %}...{% endif %}` rather than using the precomputed `meta` variable directly — the precomputed `meta` variable is technically unused after this; that's fine, remove the unused `{% assign meta = ... %}` line if you prefer, but it's not a functional bug either way (Liquid doesn't error on unused assigns).

- [ ] **Step 2: Remove the unused `meta` assign for cleanliness**

Since Step 1's inline `{% if item.company %}` branch handles the meta line directly, delete this now-unused line from the top of the file:
```liquid
{% assign meta = item.company | default: item.context %}
```
The final file should have these 4 assigns at the top:
```liquid
{% assign item = include.item %}
{% assign item_url = item.url | default: item.link %}
{% assign summary = item.tldr | default: item.oneliner %}
{% assign status_key = item.status | downcase %}
```

- [ ] **Step 3: Commit**

```powershell
git add _includes/listing-card.html
git commit -m "Add shared listing-card partial for Case/PRD/Icebox listing pages"
```

---

### Task 3: Replace the CSS — one `.listing-card*` block instead of two components

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Delete the old `.prd-list__row*` card rules**

Find and delete this entire block (currently `css/style.css:616-656`, search for `.prd-list__rows {` to locate it precisely since line numbers may have shifted from earlier edits):

```css
.prd-list__rows {
  display: flex; flex-direction: column; gap: 1px;
  background: var(--c-border); border: 1px solid var(--c-border);
  border-radius: 4px; overflow: hidden;
}
.prd-list__row {
  position: relative; overflow: hidden;
  text-decoration: none; color: var(--c-ink);
  background: var(--c-bg); border: none; cursor: pointer;
  padding: 0 32px 0 0; display: grid;
  grid-template-columns: 64px 1fr auto auto; align-items: center; gap: 24px;
  font-family: var(--f-body); text-align: left;
  transition: background var(--t-hover);
}
.prd-list__row:hover { background: var(--c-surface); }
.prd-list__row-content { padding: 28px 0; }
.prd-list__bar {
  background: var(--c-accent); align-self: stretch;
  width: 0; transition: width var(--t-bar) var(--ease-out);
}
.prd-list__row:hover .prd-list__bar { width: 64px; }
.prd-list__row::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0;
  height: 0; background: var(--c-accent);
  transition: height var(--t-bar) var(--ease-out);
}
.prd-list__row-co {
  font-family: var(--f-mono); font-size: 11px; letter-spacing: .08em;
  text-transform: uppercase; color: var(--c-accent); margin-bottom: 8px; font-weight: 500;
}
.prd-list__row-title {
  font-family: var(--f-display); font-size: 24px; line-height: 1.15;
  font-weight: 400; margin: 0 0 8px;
}
.prd-list__row-tldr { font-size: 14.5px; color: var(--c-ink-body); max-width: 52ch; }
.prd-list__row-status {
  font-family: var(--f-mono); font-size: 11px; color: var(--c-ink-strong);
  border: 1px solid var(--c-border-pill); border-radius: 999px;
  padding: 5px 12px; background: var(--c-surface); white-space: nowrap;
}
.prd-list__row-arrow { font-family: var(--f-display); font-size: 26px; color: var(--c-accent); }
```

Leave `.prd-list__outer`, `.prd-list__section`, `.prd-list__eyebrow`, `.prd-list__title`, `.prd-list__sub` (the lines just above this block) untouched — those are page-level containers, not card styles.

- [ ] **Step 2: Delete the old `.icebox__card*` rules, keep `.icebox__grid`**

Find this block (search for `.icebox__grid {`):

```css
.icebox__grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
.icebox__card {
  position: relative; overflow: hidden;
  border: 1px solid var(--c-border); border-left: 3px solid var(--c-accent); border-radius: 4px;
  background: var(--c-bg);
  padding: 26px; display: flex; flex-direction: column; gap: 14px;
  transition: background var(--t-hover);
}
.icebox__card::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0;
  height: 0; background: var(--c-accent);
  transition: height var(--t-bar) var(--ease-out);
}
.icebox__card:hover { background: var(--c-surface); }
.icebox__card:hover::before { height: 3px; }
.icebox__card--killed { border-left-color: var(--c-status-kill); }
.icebox__card--parked { border-left-color: var(--c-status-park); }
.icebox__card--later  { border-left-color: var(--c-status-later); }
.icebox__card-title-row { display: flex; align-items: center; gap: 12px; }
.icebox__status { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; border-radius: 999px; padding: 4px 11px; border: 1px solid; flex-shrink: 0; }
.icebox__status--killed  { color: var(--c-status-kill);  border-color: var(--c-status-kill); }
.icebox__status--parked  { color: var(--c-status-park);  border-color: var(--c-status-park); }
.icebox__status--later   { color: var(--c-status-later); border-color: var(--c-status-later); }
.icebox__context { font-family: var(--f-mono); font-size: 11px; color: #A8A498; }
.icebox__card-title { font-family: var(--f-display); font-size: 24px; line-height: 1.15; font-weight: 400; margin: 0; flex: 1; min-width: 0; }
.icebox__card-oneliner { font-size: 15px; line-height: 1.6; color: var(--c-ink-body); margin: 0; }
.icebox__card-footer { border-top: 1px solid var(--c-border-sub); padding-top: 14px; margin-top: auto; font-size: 14px; line-height: 1.55; color: var(--c-ink-strong); }
.icebox__why-label { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--c-ink-faint); }
```

Replace it with just:
```css
.icebox__grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
```
(i.e., keep the one `.icebox__grid` rule exactly as it was, delete every other rule in this block — they're being replaced by the new shared component in Step 4).

- [ ] **Step 3: Delete the old `.icebox__card-link` rule**

Find and delete (search for `.icebox__card-link {`):
```css
.icebox__card-link {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--f-mono); font-size: 11px; letter-spacing: .06em;
  color: var(--c-accent); text-decoration: none;
}
.icebox__card-link:hover { gap: 10px; }
```
This text-link element no longer exists in the new design (replaced by the hover-accent-bar on desktop and the static mobile arrow).

- [ ] **Step 4: Add the new `.listing-card*` block**

Add this new block where the old `.prd-list__row*` block used to be (or anywhere logical in the file — a single stylesheet, position doesn't affect behavior):

```css
/* ── LISTING CARD (shared: Case studies, PRDs, Icebox) ───────── */
.listing-card {
  position: relative; overflow: hidden;
  border: 1px solid var(--c-border); border-left: 3px solid transparent; border-radius: 4px;
  background: var(--c-bg);
  padding: 22px 26px; display: flex; flex-direction: column; gap: 10px;
  text-decoration: none; color: var(--c-ink); cursor: pointer;
  transition: background var(--t-hover), border-left-color var(--t-hover);
}
.listing-card:hover { background: var(--c-surface); border-left-color: var(--c-accent); }
.listing-card--killed:hover { border-left-color: var(--c-status-kill); }
.listing-card--parked:hover { border-left-color: var(--c-status-park); }
.listing-card--later:hover  { border-left-color: var(--c-status-later); }
.listing-card__meta {
  font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .08em;
  text-transform: uppercase; color: var(--c-ink-faint);
}
.listing-card__title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.listing-card__title {
  font-family: var(--f-display); font-size: 22px; line-height: 1.15;
  font-weight: 400; margin: 0;
}
.listing-card__status {
  font-family: var(--f-mono); font-size: 10px; letter-spacing: .08em;
  text-transform: uppercase; border-radius: 999px; padding: 3px 10px;
  border: 1px solid var(--c-accent); color: var(--c-accent); flex-shrink: 0;
}
.listing-card__status--killed { border-color: var(--c-status-kill); color: var(--c-status-kill); }
.listing-card__status--parked { border-color: var(--c-status-park); color: var(--c-status-park); }
.listing-card__status--later  { border-color: var(--c-status-later); color: var(--c-status-later); }
.listing-card__summary { font-size: 14.5px; color: var(--c-ink-body); max-width: 60ch; margin: 0; }
.listing-card__detail {
  border-top: 1px solid var(--c-border-sub); padding-top: 10px;
  font-size: 13.5px; line-height: 1.5; color: var(--c-ink-strong);
}
.listing-card__detail-label {
  font-family: var(--f-mono); font-size: 10px; letter-spacing: .08em;
  text-transform: uppercase; color: var(--c-ink-faint);
}
.listing-card__arrow-mobile { display: none; }

@media (max-width: 640px) {
  .listing-card__arrow-mobile {
    display: inline-block; align-self: flex-end; margin-top: -6px;
    font-family: var(--f-display); font-size: 18px; color: var(--c-accent);
  }
  .listing-card--killed .listing-card__arrow-mobile { color: var(--c-status-kill); }
  .listing-card--parked .listing-card__arrow-mobile { color: var(--c-status-park); }
  .listing-card--later  .listing-card__arrow-mobile { color: var(--c-status-later); }
}
```

Key design decisions reflected here (for your understanding):
- `.listing-card` itself has NO status modifier by default (`listing-card--` with an empty status_key when there's no status field, e.g. PRDs) — the base `.listing-card:hover` rule's teal `border-left-color: var(--c-accent)` is the fallback for that case, matching the "default to teal when there's no status" requirement. The three `--killed`/`--parked`/`--later` hover overrides only take effect when that modifier class is actually present (Case studies' "Shipped" status has no matching modifier rule here either, so it also correctly falls through to the teal default).
- The mobile arrow (`.listing-card__arrow-mobile`) is `display: none` by default (all screen sizes) and only becomes visible inside the `@media (max-width: 640px)` block — this ensures it never shows on desktop, regardless of hover state, since there's no hover-based visibility rule for it at all.
- The mobile arrow's color defaults to `var(--c-accent)` (teal) — matching the same "status color, or teal default" logic as the desktop hover accent bar — with the three modifier rules overriding to red/amber/green for Killed/Parked/Later.

- [ ] **Step 5: Commit**

```powershell
git add css/style.css
git commit -m "Replace two listing-card CSS components with one shared .listing-card block"
```

---

### Task 4: Update the 3 listing pages to use the shared partial

**Files:**
- Modify: `case/index.html`
- Modify: `prd/index.html`
- Modify: `icebox/index.html`

- [ ] **Step 1: Update `case/index.html`**

Task 3 deletes the old `.prd-list__rows` CSS rule (it was part of the row-card system, providing the bordered/overflow-hidden container around stacked rows) and Task 5 adds a new shared `.listing-card-list` wrapper rule — so this step updates both the include filename AND the wrapper class name together, in one pass.

Find:
```liquid
  <div class="prd-list__rows">
    {% assign sorted_items = site.case_studies | sort: 'order' %}
    {% for item in sorted_items %}
      {% include case-card.html item=item %}
    {% endfor %}
  </div>
```
Replace with:
```liquid
  <div class="listing-card-list">
    {% assign sorted_items = site.case_studies | sort: 'order' %}
    {% for item in sorted_items %}
      {% include listing-card.html item=item %}
    {% endfor %}
  </div>
```

- [ ] **Step 2: Update `prd/index.html`** (same pattern as case/index.html)

Find:
```liquid
  <div class="prd-list__rows">
    {% assign sorted_items = site.prds | sort: 'order' %}
    {% for item in sorted_items %}
      {% include case-card.html item=item %}
    {% endfor %}
  </div>
```
Replace with:
```liquid
  <div class="listing-card-list">
    {% assign sorted_items = site.prds | sort: 'order' %}
    {% for item in sorted_items %}
      {% include listing-card.html item=item %}
    {% endfor %}
  </div>
```

- [ ] **Step 3: Update `icebox/index.html`**

Find:
```liquid
  <div class="icebox__grid">
    {% assign sorted_items = site.icebox | sort: 'order' %}
    {% for item in sorted_items %}
      {% include icebox-card.html item=item %}
    {% endfor %}
  </div>
```
Replace with:
```liquid
  <div class="listing-card-list">
    {% assign sorted_items = site.icebox | sort: 'order' %}
    {% for item in sorted_items %}
      {% include listing-card.html item=item %}
    {% endfor %}
  </div>
```
(`.icebox__grid` wrapper class replaced with `listing-card-list` too, for full consistency across all 3 pages — Task 3 kept `.icebox__grid`'s CSS rule alive, but since all 3 pages should now use the identical wrapper class, delete that now-orphaned `.icebox__grid` CSS rule as part of Task 5 instead of keeping two differently-named wrapper classes with identical behavior.)

- [ ] **Step 4: Commit**

```powershell
git add case/index.html prd/index.html icebox/index.html
git commit -m "Point all 3 listing pages at the shared listing-card partial and wrapper class"
```

---

### Task 5: Add the shared list-wrapper CSS, remove orphaned `.icebox__grid`

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Remove the now-orphaned `.icebox__grid` rule**

Task 3 kept this rule alive:
```css
.icebox__grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
```
Since Task 4 replaced its usage in `icebox/index.html` with `.listing-card-list`, delete this rule now — search for `.icebox__grid {` in `css/style.css` and remove the line.

- [ ] **Step 2: Add the new shared `.listing-card-list` wrapper rule**

Add this rule (anywhere in the stylesheet; placing it near the new `.listing-card` block from Task 3 makes sense):
```css
.listing-card-list { display: flex; flex-direction: column; gap: 16px; }
```

- [ ] **Step 3: Commit**

```powershell
git add css/style.css
git commit -m "Add shared listing-card-list wrapper, remove orphaned icebox grid rule"
```

---

### Task 6: Delete the old, now-unused include partials

**Files:**
- Delete: `_includes/case-card.html`
- Delete: `_includes/icebox-card.html`

- [ ] **Step 1: Confirm nothing else references them**

Run:
```powershell
Select-String -Path "*.html","_layouts\*.html","_includes\*.html" -Pattern "case-card.html|icebox-card.html" -Recurse
```
Expected: no matches (Task 4 already replaced every usage with `listing-card.html`).

- [ ] **Step 2: Delete both files**

```powershell
Remove-Item "_includes\case-card.html"
Remove-Item "_includes\icebox-card.html"
```

- [ ] **Step 3: Commit**

```powershell
git add -A _includes/case-card.html _includes/icebox-card.html
git commit -m "Remove old case-card and icebox-card partials, replaced by listing-card"
```

---

### Task 7: Build, visual verification, and link check

**Files:** none created/modified — verification only, unless a real bug is found (see Step 8).

- [ ] **Step 1: Build the site**

```powershell
& "C:\Ruby32-x64\bin\jekyll.bat" build
```
Expected: `Generating... done in X seconds.` with no `ERROR` lines. (Use the direct `jekyll.bat` path, not `bundle exec jekyll` — `bundle exec` has a known bundler-version resolution issue on this machine.)

- [ ] **Step 2: Run the link checker**

```powershell
node scripts/verify/check-links.js
```
Expected: `No broken internal links found across 10 pages.`

- [ ] **Step 3: Manual visual pass — start the local preview**

Use the `portfolio-jekyll` preview server (Claude Preview MCP tools: `preview_start` with name `"portfolio-jekyll"`), then use `preview_inspect` (reads computed CSS/boundingClientRect reliably) rather than `preview_screenshot` for verification — screenshot has been flaky/timing out in this environment. Only attempt `preview_screenshot` once as a bonus; don't let it block you if it times out.

- [ ] **Step 4: Confirm `/case/` renders correctly**

Navigate to `/case/`. For each of the 3 case study cards, confirm:
- Meta line shows `{company} · {date_range}` (e.g. "TRACTABLE · 2025–2026").
- Title and "Shipped" status chip sit on the same row, chip immediately after the title text (not stretched to the card's right edge).
- Summary (tldr) text renders below.
- No detail block (Case studies have no `why_dropped`).
- No visible arrow at any point (inspect at desktop width — `window.innerWidth` should be ≥641 in the preview tool; if the preview panel renders narrow, use `preview_resize` with width 1280, height 800 first).
- Hovering (or simulating via `preview_inspect` on `:hover` state if the tool supports it, otherwise verify via CSS source that `.listing-card:hover` sets `border-left-color: var(--c-accent)`) shows the teal accent bar — no status modifier applies to "Shipped" text specifically, so accent should be teal, not a status color.

- [ ] **Step 5: Confirm `/prd/` renders correctly**

Navigate to `/prd/`. For each PRD card, confirm:
- Meta line shows `{company} · {date_range}`.
- Title alone, no status chip (PRDs have no `status` field — confirm no empty/broken chip element renders).
- Summary (tldr) text renders below.
- No detail block.

- [ ] **Step 6: Confirm `/icebox/` renders correctly**

Navigate to `/icebox/`. For the one real card ("YouTube Escape & Explore Chrome Extension"):
- Meta line shows the `context` field directly ("Personal Project · 2025") since this item has no `company`/`date_range` fields.
- Title and "Killed" status chip sit on the same row, chip immediately after the title.
- Summary (oneliner) text renders below.
- Detail block renders ("Why I dropped it · ...") since `why_dropped` is present.
- The whole card is wrapped in `<a>` (confirm via reading `_site/icebox/index.html`'s generated HTML — search for "YouTube Escape" and confirm it's inside an `<a href="...">` tag, not a `<div>`), since this item has `link: /icebox/youtube-extension.html` set.
- Accent-bar-on-hover resolves to `--c-status-kill` (`#E5484D`) — verify via `preview_inspect` computed styles if possible, or via CSS source confirmation that `.listing-card--killed:hover { border-left-color: var(--c-status-kill); }` exists and the card has class `listing-card--killed`.

- [ ] **Step 7: Confirm mobile breakpoint behavior**

Use `preview_resize` to set width to 375 (or any value ≤640). Reload `/icebox/`. Confirm the static arrow (`→`) now appears on the "YouTube Escape" card (since it has a real link), colored `#E5484D` (matching its Killed status) — inspect `.listing-card__arrow-mobile` computed `display` (should be `inline-block`, not `none`) and `color`.

- [ ] **Step 8: Confirm the ripple to the Icebox detail page**

Navigate to `/icebox/youtube-extension.html`. Confirm the "Approach comparison" table's rejected-option markers and this page's own status badge now render in the new brighter red (`#E5484D`) instead of the old rust-brown (`#9A4A2E`) — this is the expected, user-approved ripple from Task 1, not a regression to fix.

- [ ] **Step 9: If any check in Steps 1-8 fails**

Do not proceed to sign off. Diagnose using the actual error/visual discrepancy, fix the specific file, rebuild, and re-run the relevant checks until all pass. Commit any fix with a message describing the specific bug found.

---

## Summary of Spec Coverage

- One shared card partial replacing both existing ones — Task 2 (create), Task 4 (wire up), Task 6 (delete old ones).
- Status color tokens updated (red/amber) with accepted ripple to Icebox detail page — Task 1, verified in Task 7 Step 8.
- Field mapping (company+date_range vs context; tldr vs oneliner; optional why_dropped; optional link) — Task 2's Liquid logic, verified per-collection in Task 7 Steps 4-6.
- Chip inline beside title, hugging the title's end (not stretched) — Task 2's `.listing-card__title-row` structure + Task 3's `flex-wrap: wrap` (no `flex: 1` on the title, matching the fix already validated in the prior round for long titles).
- No visible arrow ever on desktop; accent bar only on hover, status-colored — Task 3 Step 4.
- Mobile-only static arrow, status-colored, present only on cards with a real link — Task 3 Steps 4-5, verified in Task 7 Step 7.
- Whole-card `<a>` vs `<div>` based on link presence — Task 2's `item_url` conditional wrapper.
- Testing (build, visual pass across all 3 pages, mobile check, ripple check, link check) — Task 7.
