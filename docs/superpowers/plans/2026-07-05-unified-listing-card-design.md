# Unified Listing Card Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Icebox card (`_includes/icebox-card.html`) so its status chip sits inline beside the title instead of a separate top row, and add a status-colored left accent bar — bringing it into the same visual shell already shared implicitly by the Case/PRD row card.

**Architecture:** CSS-and-template-only change. No front-matter/data changes. `_includes/case-card.html` (`.prd-list__row`) is untouched — it already conforms to the shell (border, radius, accent bar, `--c-bg`/`--c-surface` hover, type scale). Only `_includes/icebox-card.html` and its CSS rules in `css/style.css` change.

**Tech Stack:** Jekyll (Liquid templates), plain CSS (no preprocessor), existing site design tokens in `css/style.css`.

---

## Before You Start

Work happens directly on `main` (per the spec — this is a small, low-risk CSS/template change with no data migration, no branch isolation needed). Commit locally after each task; **do not push** — the user pushes explicitly when ready. All commands below assume working directory `C:\Users\prate\AI Projects\praina.github.io`. Use PowerShell for commands — the Bash tool has been unreliable in this environment (silently produces no output sometimes); if that happens, retry via PowerShell.

## Reference: Current State (facts used throughout this plan)

**Current `_includes/icebox-card.html`** (verbatim, all 13 lines):
```html
<div class="icebox__card{% if include.item.sample %} has-ribbon{% endif %}" data-reveal>
  {% if include.item.sample %}<div class="corner-ribbon">Sample</div>{% endif %}
  <div class="icebox__card-top">
    <span class="icebox__status icebox__status--{{ include.item.status | downcase }}">{{ include.item.status }}</span>
    <span class="icebox__context">{{ include.item.context }}</span>
  </div>
  <h2 class="icebox__card-title">{{ include.item.title }}</h2>
  <p class="icebox__card-oneliner">{{ include.item.oneliner }}</p>
  <div class="icebox__card-footer">
    <span class="icebox__why-label">Why I dropped it · </span>{{ include.item.why_dropped }}
  </div>
  {% if include.item.link %}<a href="{{ include.item.link }}" class="icebox__card-link">Full decision analysis →</a>{% endif %}
</div>
```

**Current relevant CSS** (`css/style.css`, around line 895):
```css
.icebox__card {
  position: relative; overflow: hidden;
  border: 1px solid var(--c-border); border-radius: 4px; background: var(--c-bg);
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
.icebox__card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.icebox__status { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; border-radius: 999px; padding: 4px 11px; border: 1px solid; }
.icebox__status--killed  { color: var(--c-status-kill);  border-color: var(--c-status-kill); }
.icebox__status--parked  { color: var(--c-status-park);  border-color: var(--c-status-park); }
.icebox__status--later   { color: var(--c-status-later); border-color: var(--c-status-later); }
.icebox__context { font-family: var(--f-mono); font-size: 11px; color: #A8A498; }
.icebox__card-title { font-family: var(--f-display); font-size: 24px; line-height: 1.15; font-weight: 400; margin: 0; }
.icebox__card-oneliner { font-size: 15px; line-height: 1.6; color: var(--c-ink-body); margin: 0; }
.icebox__card-footer { border-top: 1px solid var(--c-border-sub); padding-top: 14px; margin-top: auto; font-size: 14px; line-height: 1.55; color: var(--c-ink-strong); }
.icebox__why-label { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--c-ink-faint); }
```

**Design tokens used** (already defined in `css/style.css`, around line 19):
```css
--c-status-kill:  #9A4A2E;
--c-status-park:  #1B4F72;
--c-status-later: #3F6E4B;
```

**Important correction vs. the design spec's mockup colors:** the brainstorming mockups used red/amber as placeholder colors for illustration. The actual site tokens are `--c-status-kill: #9A4A2E` (a warm brick/rust tone, not pure red) and `--c-status-park: #1B4F72` (a blue tone, not amber). Use the real tokens, not the mockup colors, throughout this plan.

**Confirmed already-consistent behavior** (no change needed): both `.prd-list__row` and `.icebox__card` already rest on `background: var(--c-bg)` and hover to `background: var(--c-surface)` — this part of the "shared shell" was already true before this plan; only the accent-bar color and the chip/title layout need to change.

**Only 1 of 3 Icebox items has a live page today** (`_icebox/youtube-extension.html`, `status: Killed`, `sample: false`). The other two (`study-plan-generator.html`, `report-config-portal.html`) were removed from the collection in an earlier cleanup pass — so the `Parked` status color can only be verified by temporarily checking CSS specificity/values, not by viewing a live rendered `Parked` card. Note this in the manual visual pass step instead of treating it as a blocker.

---

### Task 1: Restructure `_includes/icebox-card.html` — chip inline beside title

**Files:**
- Modify: `_includes/icebox-card.html`

- [ ] **Step 1: Replace the file's contents**

Replace the entire contents of `_includes/icebox-card.html` with:

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

Note what changed from the current version:
- `.icebox__card-top` (which held status + context side by side) is removed.
- A new top-level class `icebox__card--{{ status }}` (e.g. `icebox__card--killed`) is added to the outer card div — this is what the CSS in Task 2 uses to color the left accent bar by status.
- `.icebox__context` is now its own line, directly under the ribbon, above the title (no more inline status text next to it).
- A new `.icebox__card-title-row` wraps the title and the status chip together, so they sit on the same line.

- [ ] **Step 2: Verify the file reads correctly**

Read the file back and confirm it matches exactly what's shown in Step 1 — 12 lines, no leftover `.icebox__card-top` div, no duplicate status rendering.

- [ ] **Step 3: Commit**

```powershell
git add _includes/icebox-card.html
git commit -m "Move Icebox status chip inline beside title, drop separate top row"
```

---

### Task 2: Update CSS — accent bar color-by-status, title-row layout, cleanup

**Files:**
- Modify: `css/style.css` (the `.icebox__card*` block, around line 895)

- [ ] **Step 1: Replace the existing `.icebox__card*` CSS block**

Find this exact block in `css/style.css` (it starts around line 895):

```css
.icebox__card {
  position: relative; overflow: hidden;
  border: 1px solid var(--c-border); border-radius: 4px; background: var(--c-bg);
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
.icebox__card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.icebox__status { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; border-radius: 999px; padding: 4px 11px; border: 1px solid; }
.icebox__status--killed  { color: var(--c-status-kill);  border-color: var(--c-status-kill); }
.icebox__status--parked  { color: var(--c-status-park);  border-color: var(--c-status-park); }
.icebox__status--later   { color: var(--c-status-later); border-color: var(--c-status-later); }
.icebox__context { font-family: var(--f-mono); font-size: 11px; color: #A8A498; }
.icebox__card-title { font-family: var(--f-display); font-size: 24px; line-height: 1.15; font-weight: 400; margin: 0; }
.icebox__card-oneliner { font-size: 15px; line-height: 1.6; color: var(--c-ink-body); margin: 0; }
.icebox__card-footer { border-top: 1px solid var(--c-border-sub); padding-top: 14px; margin-top: auto; font-size: 14px; line-height: 1.55; color: var(--c-ink-strong); }
.icebox__why-label { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--c-ink-faint); }
```

Replace it with:

```css
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
.icebox__card-title-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.icebox__status { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; border-radius: 999px; padding: 4px 11px; border: 1px solid; flex-shrink: 0; }
.icebox__status--killed  { color: var(--c-status-kill);  border-color: var(--c-status-kill); }
.icebox__status--parked  { color: var(--c-status-park);  border-color: var(--c-status-park); }
.icebox__status--later   { color: var(--c-status-later); border-color: var(--c-status-later); }
.icebox__context { font-family: var(--f-mono); font-size: 11px; color: #A8A498; }
.icebox__card-title { font-family: var(--f-display); font-size: 24px; line-height: 1.15; font-weight: 400; margin: 0; }
.icebox__card-oneliner { font-size: 15px; line-height: 1.6; color: var(--c-ink-body); margin: 0; }
.icebox__card-footer { border-top: 1px solid var(--c-border-sub); padding-top: 14px; margin-top: auto; font-size: 14px; line-height: 1.55; color: var(--c-ink-strong); }
.icebox__why-label { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--c-ink-faint); }
```

Key changes:
- `.icebox__card` gets a permanent `border-left: 3px solid var(--c-accent)` (teal) as the default/fallback color — matching the Case/PRD row card's accent bar, satisfying the "shared shell" goal even for any future Icebox item that has no status-specific color mapped.
- Three new modifier rules (`.icebox__card--killed`, `--parked`, `--later`) override that left border color to match each status's token — this is what Task 1's new `icebox__card--{{ status }}` class hooks into.
- `.icebox__card-top` (old side-by-side status+context row) is deleted — no longer used.
- New `.icebox__card-title-row` rule: `align-items: center` (not `baseline`) so the status chip sits vertically centered against the title text, per the user's explicit request during brainstorming. `flex-wrap: wrap` so long titles don't force the chip off-card on narrow viewports.
- `.icebox__status` gets `flex-shrink: 0` added so the chip never gets visually compressed if the title text is long.

- [ ] **Step 2: Verify no leftover references to the deleted class**

Run:
```powershell
Select-String -Path "css\style.css" -Pattern "icebox__card-top"
```
Expected: no output (the rule and all references are fully removed).

- [ ] **Step 3: Commit**

```powershell
git add css/style.css
git commit -m "Add status-colored accent bar and title-row layout for Icebox cards"
```

---

### Task 3: Build, visual verification, and link check

**Files:** none created/modified — verification only.

- [ ] **Step 1: Build the site**

```powershell
& "C:\Ruby32-x64\bin\jekyll.bat" build
```
Expected: `Generating... done in X seconds.` with no `ERROR` lines. (Use the direct `jekyll.bat` path, not `bundle exec jekyll` — `bundle exec` has a known bundler-version resolution issue on this machine that doesn't affect the direct binary.)

- [ ] **Step 2: Run the link checker**

```powershell
node scripts/verify/check-links.js
```
Expected: `No broken internal links found across 10 pages.`

- [ ] **Step 3: Manual visual pass — start the local preview**

If not already running, use the `portfolio-jekyll` preview server (already configured in `.claude/launch.json`) to view the site locally, or run:
```powershell
& "C:\Ruby32-x64\bin\jekyll.bat" serve --port 4000
```
Then open `http://localhost:4000/`.

- [ ] **Step 4: Confirm `/case/` and `/prd/` are visually unchanged**

Load `/case/` and `/prd/`. Confirm the row cards (bar, company/date, title, tldr, arrow, optional Sample ribbon, optional Shipped badge) look exactly as they did before this change — this plan does not touch `_includes/case-card.html` or its CSS, so this is a regression check, not a new feature.

- [ ] **Step 5: Confirm `/icebox/` shows the new layout correctly**

Load `/icebox/`. Confirm the one real card ("YouTube Escape & Explore Chrome Extension"):
- Has a left accent bar colored with `--c-status-kill` (`#9A4A2E`, a warm brick/rust tone) — not the default teal — since its status is `Killed`.
- Shows "Killed" as a pill chip sitting on the same line as the title, vertically centered against it (not hanging low against the title's text baseline).
- Shows context ("Personal Project · 2025") on its own line above the title, with no status text mixed into it.
- Still shows the "Why I dropped it" footer and the "Full decision analysis →" link, unchanged.

- [ ] **Step 6: Note the untestable Parked-status path**

There is currently no live Icebox item with `status: Parked`, so the `--c-status-park` (`#1B4F72`, blue) accent-bar color cannot be visually confirmed end-to-end on this pass. Confirm instead by inspecting the CSS rule directly:
```powershell
Select-String -Path "css\style.css" -Pattern "icebox__card--parked"
```
Expected: one line showing `.icebox__card--parked { border-left-color: var(--c-status-park); }`. This confirms the rule exists correctly and will apply automatically whenever a future Icebox item with `status: Parked` is added to the collection.

- [ ] **Step 7: If any check in Steps 1-6 fails**

Do not proceed to commit further changes. Diagnose using the actual error/visual discrepancy, fix the specific file (`_includes/icebox-card.html` or `css/style.css`), rebuild, and re-run Steps 1-6 until all pass.

(No commit in this task — it's verification-only. If Step 7 requires a fix, that fix gets its own commit describing the specific bug found, following the same pattern as Tasks 1-2.)

---

## Summary of Spec Coverage

- Shared shell (border, radius, background/hover, type scale) — already true for both card types before this plan; confirmed, not modified.
- Left accent bar, teal default — added to `.icebox__card` in Task 2.
- Icebox status chip inline beside title, center-aligned — Task 1 (template) + Task 2 (CSS `align-items: center`).
- Accent bar colored by status (Killed/Parked/Later) — Task 2's three modifier rules.
- Meta line becomes context-only, no status text mixed in — Task 1.
- Corner "Sample" ribbon unchanged — untouched in Task 1's template (still conditionally rendered exactly as before).
- No front-matter/data changes — confirmed, no `_icebox/*.html` or `_case_studies/*.html` or `_prds/*.html` data files are touched by this plan.
- Testing (build, visual pass, link check) — Task 3.
