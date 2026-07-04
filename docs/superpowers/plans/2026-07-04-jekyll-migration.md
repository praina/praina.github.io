# Jekyll Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate praina.github.io from 12 hand-duplicated static HTML pages to a Jekyll site with shared includes/layouts and collections, while preserving every existing URL exactly and keeping `main` untouched until final review.

**Architecture:** Introduce `_config.yml`, `_includes/` (head, nav, footer, two card partials), `_layouts/` (default, case-study), and three collections (`case_studies`, `prds` output as real pages; `icebox` as pure front-matter data feeding the listing page, since only one Icebox idea has a full write-up). GitHub Pages builds this natively on push — no CI needed. Local preview via `bundle exec jekyll serve`.

**Tech Stack:** Jekyll (Ruby/Bundler), GitHub Pages' native Jekyll build, Node.js for verification scripts (URL parity + content diff).

---

## Before You Start

All work happens on the `jekyll-migration` branch (already created, spec already committed there). Never touch `main` during this plan. Every task below assumes your working directory is the repo root: `C:\Users\prate\AI Projects\praina.github.io`.

## Reference: Current Structure (read-only facts used throughout this plan)

- **Index nav** (`index.html:17-40`) uses relative links (`case/`, `prd/`, `icebox/`, `#experience`, `#contact`) and footer class `footer`.
- **Subpage nav** (e.g. `case/index.html:17-40`) uses absolute links (`/case/`, `/prd/`, `/icebox/`, `/#experience`, `/#contact`) and footer class `footer footer--plain`.
- Migration will standardize **all pages to absolute links** (`/case/`, `/prd/`, `/icebox/`, `/#experience`, `/#contact`, `/`) — this is safe because the site is served from the domain root on GitHub Pages, and is required for one shared `nav.html` to work everywhere regardless of page depth.
- **Case study collection fields** (from `case/index.html:52-82`): `company`, `date_range`, `title`, `tldr`, `status` ("Shipped"), `sample` (boolean, shows a "Sample" corner ribbon), `permalink`.
- **PRD collection fields** (from `prd/index.html:51-88`): same as case studies minus `status`.
- **Icebox fields** (from `icebox/index.html:52-89`): `status` (`Killed` or `Parked`, driving `icebox__status--killed`/`icebox__status--parked` class), `context`, `title`, `oneliner`, `why_dropped`, `sample` (boolean), `link` (optional — only present for `youtube-extension`).
- **Sample banner**: some case study/PRD pages show a banner (`case/amex-reporting.html:42-47`): `<div class="sample-banner">...Illustrative write-up...</div>`. This is per-page, driven by a `sample: true` front matter flag on the individual page (not the listing card `sample` ribbon, which is a separate concern reusing the same flag).

---

### Task 1: Jekyll scaffolding + baseline snapshot for regression testing

**Files:**
- Create: `Gemfile`
- Create: `_config.yml`
- Create: `scripts/verify/snapshot-baseline.js`
- Create: `.baseline/` (generated, gitignored)
- Modify: `.gitignore`

- [ ] **Step 1: Write the Gemfile**

```ruby
source "https://rubygems.org"
gem "github-pages", group: :jekyll_plugins
```

- [ ] **Step 2: Write `_config.yml`**

```yaml
title: Prateek Raina | Technical Product Manager
description: Technical Product Manager specialising in B2B SaaS, enterprise migrations, and AI products.
url: "https://praina.github.io"
baseurl: ""

collections:
  case_studies:
    output: true
  prds:
    output: true
  icebox:
    output: false

defaults:
  - scope:
      path: ""
      type: "case_studies"
    values:
      layout: "case-study"
  - scope:
      path: ""
      type: "prds"
    values:
      layout: "case-study"

exclude:
  - Gemfile
  - Gemfile.lock
  - scripts
  - docs
  - .baseline
```

- [ ] **Step 3: Run `bundle install`**

Run: `bundle install`
Expected: Installs `github-pages` gem and dependencies with no errors.

- [ ] **Step 4: Snapshot the current (pre-migration) site as the regression baseline**

Before any HTML files are touched, copy the current rendered site verbatim — this is the "known good" output we diff every later change against.

```javascript
// scripts/verify/snapshot-baseline.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const BASELINE_DIR = path.join(ROOT, '.baseline');

const FILES_TO_SNAPSHOT = [
  'index.html',
  'case/index.html',
  'case/CASE1-localization-proxy-tool.html',
  'case/CASE2-tractable-migration.html',
  'case/amex-reporting.html',
  'prd/index.html',
  'prd/PRD1-intelligent-triage.html',
  'prd/PRD2-multi-brand-migration.html',
  'prd/whatsapp-chatbot.html',
  'prd/failover-mechanism.html',
  'icebox/index.html',
  'icebox/youtube-extension.html',
];

fs.rmSync(BASELINE_DIR, { recursive: true, force: true });
fs.mkdirSync(BASELINE_DIR, { recursive: true });

for (const relPath of FILES_TO_SNAPSHOT) {
  const src = path.join(ROOT, relPath);
  const dest = path.join(BASELINE_DIR, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

console.log(`Snapshotted ${FILES_TO_SNAPSHOT.length} files to .baseline/`);
```

Run: `node scripts/verify/snapshot-baseline.js`
Expected output: `Snapshotted 12 files to .baseline/`

- [ ] **Step 5: Add `.baseline/` and Jekyll build output to `.gitignore`**

```
_site/
.jekyll-cache/
.baseline/
```

- [ ] **Step 6: Commit**

```bash
git add Gemfile _config.yml scripts/verify/snapshot-baseline.js .gitignore
git commit -m "Add Jekyll scaffolding and pre-migration baseline snapshot script"
```

---

### Task 2: Shared includes — head, nav, footer

**Files:**
- Create: `_includes/head.html`
- Create: `_includes/nav.html`
- Create: `_includes/footer.html`

- [ ] **Step 1: Write `_includes/head.html`**

Reproduces `index.html:3-13`, parameterized by front matter.

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{% if page.title %}{{ page.title }} | Prateek Raina{% else %}{{ site.title }}{% endif %}</title>
<meta name="description" content="{{ page.description | default: site.description }}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<script defer src="https://cloud.umami.is/script.js" data-website-id="cc8b1324-235b-423e-a858-fe1f1da5c2f1"></script>
```

- [ ] **Step 2: Write `_includes/nav.html`**

Standardizes on absolute links (matches current subpage behavior) and adds active-link highlighting.

```html
<nav class="nav">
  <div class="nav__inner">
    <a href="/" class="nav__wordmark">Praina<span>.</span></a>
    <ul class="nav__links">
      <li><a href="/case/"       class="nav__link{% if page.url contains '/case/' %} is-active{% endif %}">Work</a></li>
      <li><a href="/prd/"        class="nav__link{% if page.url contains '/prd/' %} is-active{% endif %}">PRDs</a></li>
      <li><a href="/icebox/"     class="nav__link{% if page.url contains '/icebox/' %} is-active{% endif %}">Icebox</a></li>
      <li><a href="/#experience" class="nav__link">Experience</a></li>
    </ul>
    <a href="/#contact" class="nav__cta">Get in touch</a>
    <button class="nav__hamburger" id="hamburger" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<div class="nav__mobile-overlay" id="mobileOverlay">
  <a href="/case/"       onclick="closeMobileNav()">Work</a>
  <a href="/prd/"        onclick="closeMobileNav()">PRDs</a>
  <a href="/icebox/"     onclick="closeMobileNav()">Icebox</a>
  <a href="/#experience" onclick="closeMobileNav()">Experience</a>
  <a href="/#contact"    onclick="closeMobileNav()">Contact</a>
</div>
```

- [ ] **Step 3: Write `_includes/footer.html`**

```html
<footer class="footer{% if page.plain_footer %} footer--plain{% endif %}">
  <div class="footer__inner">
    <span class="footer__wordmark">Praina<span>.</span></span>
    <span class="footer__copy">{% if page.plain_footer %}© 2026 Prateek Raina · GitHub Pages{% else %}© 2026 Prateek Raina · Built with intention, deployed on GitHub Pages{% endif %}</span>
  </div>
</footer>
```

- [ ] **Step 4: Add a CSS rule for the new `.is-active` class**

Check `css/style.css` for the existing `.nav__link` rule (search for `.nav__link {`), and add directly beneath it:

```css
.nav__link.is-active { color: var(--c-accent); }
```

- [ ] **Step 5: Commit**

```bash
git add _includes/head.html _includes/nav.html _includes/footer.html css/style.css
git commit -m "Add shared head/nav/footer includes with active-link highlighting"
```

---

### Task 3: Layouts

**Files:**
- Create: `_layouts/default.html`
- Create: `_layouts/case-study.html`

- [ ] **Step 1: Write `_layouts/default.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
{% include head.html %}
</head>
<body>

{% include nav.html %}

{{ content }}

{% include footer.html %}

<script src="/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `_layouts/case-study.html`**

Adds the sample banner (reproducing `case/amex-reporting.html:41-47`) when `sample: true` is set in a page's front matter, otherwise identical to default.

```html
<!DOCTYPE html>
<html lang="en">
<head>
{% include head.html %}
</head>
<body>

{% include nav.html %}

{% if page.sample %}
<div class="sample-banner">
  <div class="sample-banner__inner">
    <div class="sample-banner__dot"></div>
    <p class="sample-banner__text"><strong>Illustrative write-up</strong> · Based on real work · Details simplified for portfolio presentation</p>
  </div>
</div>
{% endif %}

{{ content }}

{% include footer.html %}

<script src="/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add _layouts/default.html _layouts/case-study.html
git commit -m "Add default and case-study layouts"
```

---

### Task 4: Migrate index.html to use the default layout

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace the `<head>`, nav, mobile-overlay, footer, and closing script/tags with front matter + layout**

Open `index.html`. Delete lines 1-41 (the `<!DOCTYPE>` through the closing `</div>` of `.nav__mobile-overlay`) and replace with:

```yaml
---
layout: default
title: Technical Product Manager
description: Technical Product Manager specialising in B2B SaaS, enterprise migrations, and AI products. Currently at Tractable.
---
```

Note: the `title` front matter here renders as "Technical Product Manager | Prateek Raina" via `head.html`'s template — for the homepage specifically we want the exact original `<title>Prateek Raina | Technical Product Manager</title>`. Handle this as a special case in `_includes/head.html`: add `{% if page.url == "/" %}Prateek Raina | Technical Product Manager{% else %}...{% endif %}` as the first branch, ahead of the `page.title` check written in Task 2 Step 1. Update `_includes/head.html` now to add this branch.

Then keep everything from the current `<!-- HERO -->` section (`index.html:42` onward, now shifted) down to (but not including) the `<!-- FOOTER -->` comment and everything after it — delete the footer block and closing `<script src="js/main.js"></script></body></html>` at the end of the file (previously lines 410-421).

- [ ] **Step 2: Fix the resume link's relative path if needed**

Confirm the download link still reads `href="/Prateek-Raina.pdf"` (it already uses an absolute path per current `index.html:53` — no change needed).

- [ ] **Step 3: Commit**

```bash
git add index.html _includes/head.html
git commit -m "Migrate index.html to Jekyll default layout"
```

---

### Task 5: Migrate case studies into the `case_studies` collection

**Files:**
- Create: `_case_studies/case1-localization-proxy-tool.html`
- Create: `_case_studies/case2-tractable-migration.html`
- Create: `_case_studies/amex-reporting.html`
- Delete: `case/CASE1-localization-proxy-tool.html`
- Delete: `case/CASE2-tractable-migration.html`
- Delete: `case/amex-reporting.html`

For each of the three files, perform the same mechanical transform:

- [ ] **Step 1: For `case/CASE1-localization-proxy-tool.html` → `_case_studies/case1-localization-proxy-tool.html`**

Read the current file. Take everything between (and including) the `<!-- CASE HEADER -->` (or equivalent first content div — for CASE1 this is whatever div opens right after the mobile nav overlay) through the content just before the `<!-- FOOTER -->` comment. This becomes the entire body of the new collection file.

Prepend front matter:

```yaml
---
layout: case-study
title: How I Vibe-Coded My Way Out of a Bottleneck, Courtesy of Claude
description: Built a self-serve Lokalise proxy layer, prototyped in Lovable and rebuilt in Claude Code, to remove myself as the bottleneck on every localization key submission.
permalink: /case/CASE1-localization-proxy-tool.html
company: Tractable
date_range: "2026"
tldr: Built a self-serve Lokalise proxy layer, prototyped in Lovable and rebuilt in Claude Code, to remove myself as the bottleneck on every localization key submission.
status: Shipped
sample: false
---
```

Save the front matter + body content to `_case_studies/case1-localization-proxy-tool.html`. Delete the old `case/CASE1-localization-proxy-tool.html`.

- [ ] **Step 2: For `case/CASE2-tractable-migration.html` → `_case_studies/case2-tractable-migration.html`**

Same transform. Front matter:

```yaml
---
layout: case-study
title: Enterprise Platform Migration
description: Owned end-to-end migration of 5+ enterprise clients onto a modern AI-powered architecture with zero regression at every go-live.
permalink: /case/CASE2-tractable-migration.html
company: Tractable
date_range: "2025–2026"
tldr: Owned end-to-end migration of 5+ enterprise clients onto a modern AI-powered architecture: per-client PRDs, automated API testing via Claude Code, and phased cutovers with zero regression at every go-live.
status: Shipped
sample: false
---
```

- [ ] **Step 3: For `case/amex-reporting.html` → `_case_studies/amex-reporting.html`**

Same transform, but this page currently has the sample banner, so set `sample: true`. Front matter:

```yaml
---
layout: case-study
title: Bureau Reporting Modernisation
description: How I modernised bureau reporting infrastructure at American Express, from legacy SFTP to REST API, with 40% faster processing and 99.9%+ uptime.
permalink: /case/amex-reporting.html
company: American Express
date_range: "2022–2024"
tldr: Migrated bureau reporting from legacy infrastructure to REST API: ~40% faster processing, ~99% on-time delivery, and 99.9%+ uptime through failover implementation.
status: Shipped
sample: true
---
```

When extracting the body for this file, remove the now-redundant hardcoded sample-banner block (`<!-- SAMPLE BANNER -->` through its closing `</div>`) since the layout now renders it from `sample: true`.

- [ ] **Step 4: Commit**

```bash
git add _case_studies/ case/CASE1-localization-proxy-tool.html case/CASE2-tractable-migration.html case/amex-reporting.html
git commit -m "Migrate case studies into Jekyll case_studies collection"
```

---

### Task 6: Migrate PRDs into the `prds` collection

**Files:**
- Create: `_prds/prd1-intelligent-triage.html`
- Create: `_prds/prd2-multi-brand-migration.html`
- Create: `_prds/whatsapp-chatbot.html`
- Create: `_prds/failover-mechanism.html`
- Delete: `prd/PRD1-intelligent-triage.html`
- Delete: `prd/PRD2-multi-brand-migration.html`
- Delete: `prd/whatsapp-chatbot.html`
- Delete: `prd/failover-mechanism.html`

Same mechanical transform as Task 5 (no `status` field — PRDs don't have a status ribbon).

- [ ] **Step 1: `prd/PRD1-intelligent-triage.html` → `_prds/prd1-intelligent-triage.html`**

```yaml
---
layout: case-study
title: Migrating a Legacy-Stack Insurer to Full Platform Parity
description: PRD for enabling AI-powered claims triage and estimating for a major insurer that must stay on a legacy API stack.
permalink: /prd/PRD1-intelligent-triage.html
company: Tractable
date_range: "2025"
tldr: PRD for enabling AI-powered claims triage and estimating for a major insurer that must stay on a legacy API stack, bridging the gap without requiring any change on their side.
sample: false
---
```

- [ ] **Step 2: `prd/PRD2-multi-brand-migration.html` → `_prds/prd2-multi-brand-migration.html`**

```yaml
---
layout: case-study
title: Migrating a Multi-Brand Insurer to Full Platform Parity
description: PRD for migrating a major insurer and its digital-first subsidiary brand off a shared legacy claims stack.
permalink: /prd/PRD2-multi-brand-migration.html
company: Tractable
date_range: "2025"
tldr: PRD for migrating a major insurer and its digital-first subsidiary brand off a shared legacy claims stack, including a new licence-plate matching capability.
sample: false
---
```

- [ ] **Step 3: `prd/failover-mechanism.html` → `_prds/failover-mechanism.html`**

```yaml
---
layout: case-study
title: Reporting Platform Failover
description: PRD for adding automatic failover to the bureau reporting pipeline, eliminating a single point of failure.
permalink: /prd/failover-mechanism.html
company: American Express
date_range: "2023"
tldr: PRD for adding automatic failover to the bureau reporting pipeline, eliminating the single point of failure that caused intermittent platform outages.
sample: true
---
```

Remove any hardcoded sample banner in the body (same as Task 5 Step 3) if present.

- [ ] **Step 4: `prd/whatsapp-chatbot.html` → `_prds/whatsapp-chatbot.html`**

```yaml
---
layout: case-study
title: WhatsApp Conditional Chatbot
description: PRD for a conditional logic chatbot on WhatsApp to re-engage lapsed learners.
permalink: /prd/whatsapp-chatbot.html
company: Vedantu
date_range: "2022"
tldr: PRD for a conditional logic chatbot on WhatsApp to re-engage lapsed learners: drove +15pp engagement and +5pp inbound sales leads.
sample: true
---
```

Remove any hardcoded sample banner in the body if present.

- [ ] **Step 5: Commit**

```bash
git add _prds/ prd/PRD1-intelligent-triage.html prd/PRD2-multi-brand-migration.html prd/whatsapp-chatbot.html prd/failover-mechanism.html
git commit -m "Migrate PRDs into Jekyll prds collection"
```

---

### Task 7: Migrate Icebox into a data-only collection + standalone detail page

Only `youtube-extension.html` has a full write-up; the other two Icebox cards are listing-only. The `icebox` collection is configured `output: false` (Task 1), so its documents are pure data feeding the listing page — they never render as their own pages.

**Files:**
- Create: `_icebox/youtube-extension.html`
- Create: `_icebox/study-plan-generator.html`
- Create: `_icebox/report-config-portal.html`
- Modify: `icebox/youtube-extension.html` (becomes a standalone page using `case-study` layout, not part of the collection)

- [ ] **Step 1: Create `_icebox/youtube-extension.html`** (data only — this collection doc is never rendered itself)

```yaml
---
status: Killed
context: "Personal Project · 2025"
title: "YouTube Escape & Explore Chrome Extension"
oneliner: A browser extension to replace YouTube's algorithm with intent-based discovery: pick a topic, get curated content. Three implementation paths evaluated, all rejected on different grounds.
why_dropped: "Every viable technical approach had a fatal flaw: API proxy required a backend startup, search hacking produced unreliable results, and manual curation made me the permanent bottleneck. Killed it before writing a line of code."
sample: false
link: /icebox/youtube-extension.html
---
```

- [ ] **Step 2: Create `_icebox/study-plan-generator.html`**

```yaml
---
status: Killed
context: "Vedantu · 2022"
title: AI-Powered Study Plan Generator
oneliner: A personalised weekly study scheduler built on learner performance data, auto-adjusting difficulty and pacing based on quiz results and time spent.
why_dropped: "The data quality upstream wasn't there. Quiz completion rates were below 30%, making the personalisation layer meaningless noise. Building a sophisticated scheduler on top of dirty input data would have shipped something that felt smart but wasn't, and would have eroded trust faster than no feature at all. Killed it, redirected effort to fixing the completion rate problem first."
sample: true
link:
---
```

- [ ] **Step 3: Create `_icebox/report-config-portal.html`**

```yaml
---
status: Parked
context: "American Express · 2023"
title: Self-Serve Report Configuration Portal
oneliner: A portal allowing bureau reporting team members to configure report parameters, schedules, and delivery formats without engineering involvement.
why_dropped: "The idea was sound but the timing was wrong. We were mid-migration and adding a configuration UI on top of a system in flux would have created two surfaces to maintain simultaneously. The value proposition also depended on a stable schema, which we didn't have yet. Parked it for post-migration; the bones of the spec are solid and worth revisiting."
sample: true
link:
---
```

- [ ] **Step 4: Convert `icebox/youtube-extension.html` into a standalone Jekyll page**

This file is NOT part of the `_icebox` collection (it stays at its current path). Replace its `<head>`/nav/footer/script boilerplate (currently lines 1-38 and the closing footer/script/html at the bottom) with front matter + layout, keeping the `<article class="icebox-detail">...</article>` body content (from line 40 onward in the current file) unchanged:

```yaml
---
layout: case-study
title: "YouTube Escape & Explore | Icebox"
description: How I evaluated and killed a Chrome extension idea, a structured PM decision on three competing technical approaches.
sample: false
---
```

- [ ] **Step 5: Commit**

```bash
git add _icebox/ icebox/youtube-extension.html
git commit -m "Migrate Icebox items into data collection plus standalone detail page"
```

---

### Task 8: Rewrite listing pages to loop over collections

**Files:**
- Create: `_includes/case-card.html`
- Create: `_includes/icebox-card.html`
- Modify: `case/index.html`
- Modify: `prd/index.html`
- Modify: `icebox/index.html`

- [ ] **Step 1: Write `_includes/case-card.html`** (shared by case studies and PRDs — same card shape, `status` is optional)

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

- [ ] **Step 2: Write `_includes/icebox-card.html`**

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

- [ ] **Step 3: Rewrite `case/index.html`**

Replace the entire file. Front matter + layout replace the head/nav/footer boilerplate; the `<!-- CONTENT -->` div is preserved verbatim except the hardcoded rows are replaced with a loop:

```yaml
---
layout: default
title: Selected Work
description: Case studies from Prateek Raina, platform migrations, fintech data infrastructure, and B2B SaaS product work.
plain_footer: true
---
<div class="prd-list__outer">
<div class="prd-list__section">
  <a href="/" class="back-link">← Home</a>

  <p class="eyebrow prd-list__eyebrow">Case Studies</p>
  <h1 class="prd-list__title">Selected work</h1>
  <p class="prd-list__sub">End-to-end case studies with problem framing, approach, trade-off analysis, and outcomes. Each project was owned from discovery through delivery.</p>

  <div class="prd-list__rows">
    {% for item in site.case_studies %}
      {% include case-card.html item=item %}
    {% endfor %}
  </div>
</div>
</div>
```

Note: `case-card.html` as written in Step 1 uses `include.item`, matching Jekyll's `{% include x.html item=item %}` parameter-passing convention — no change needed there.

- [ ] **Step 4: Rewrite `prd/index.html`**

Same pattern as Step 3, looping over `site.prds`, preserving the "More writing samples" footnote paragraph:

```yaml
---
layout: default
title: PRD Writing Samples
description: PRD writing samples from Prateek Raina, structured product requirements documents from B2B SaaS, fintech, and edtech contexts.
plain_footer: true
---
<div class="prd-list__outer">
<div class="prd-list__section">
  <a href="/" class="back-link">← Home</a>

  <p class="eyebrow prd-list__eyebrow">Writing samples</p>
  <h1 class="prd-list__title">PRD library</h1>
  <p class="prd-list__sub">Structured product requirements documents showing how I frame problems, scope decisions, and define success. Real contexts, detail sanitised where appropriate.</p>

  <div class="prd-list__rows">
    {% for item in site.prds %}
      {% include case-card.html item=item %}
    {% endfor %}
  </div>

  <p style="margin-top:32px;font-family:var(--f-mono);font-size:12px;color:var(--c-ink-faint);letter-spacing:.04em;">More writing samples added as projects conclude. <a href="/icebox/" style="color:var(--c-accent);text-decoration:none;">See the Icebox →</a></p>
</div>
</div>
```

- [ ] **Step 5: Rewrite `icebox/index.html`**

Loops over `site.icebox` (the data-only collection from Task 7):

```yaml
---
layout: default
title: The Icebox
description: Shelved and killed product ideas from Prateek Raina, showing product judgment through what didn't ship and why.
plain_footer: true
---
<div class="icebox__outer">
<div class="icebox__section">
  <a href="/" class="back-link">← Home</a>

  <p class="eyebrow icebox__eyebrow">❄ The Icebox</p>
  <h1 class="icebox__title">Ideas that didn't ship</h1>
  <p class="icebox__sub">Product judgment shows up as much in what you don't build as in what you do. These are ideas I explored, advocated for, or scoped, then killed, parked, or deferred. Each one taught me something.</p>

  <div class="icebox__grid">
    {% for item in site.icebox %}
      {% include icebox-card.html item=item %}
    {% endfor %}
  </div>
</div>
</div>
```

- [ ] **Step 6: Add `plain_footer` handling check**

Confirm `_includes/footer.html` (Task 2) reads `page.plain_footer`, matching the front matter added above. No further change needed if Task 2 was implemented as written.

- [ ] **Step 7: Commit**

```bash
git add _includes/case-card.html _includes/icebox-card.html case/index.html prd/index.html icebox/index.html
git commit -m "Rewrite listing pages to loop over Jekyll collections"
```

---

### Task 9: Build and verify — URL parity, content diff, link check

**Files:**
- Create: `scripts/verify/check-url-parity.js`
- Create: `scripts/verify/diff-content.js`
- Create: `scripts/verify/check-links.js`

- [ ] **Step 1: Build the site**

Run: `bundle exec jekyll build`
Expected: Completes with no `ERROR` or `WARN` lines. If there are errors, fix them before proceeding — do not continue to verification with a broken build.

- [ ] **Step 2: Write the URL parity script**

```javascript
// scripts/verify/check-url-parity.js
const fs = require('fs');
const path = require('path');

const SITE_DIR = path.resolve(__dirname, '../../_site');

const EXPECTED_URLS = [
  '/index.html',
  '/case/index.html',
  '/case/CASE1-localization-proxy-tool.html',
  '/case/CASE2-tractable-migration.html',
  '/case/amex-reporting.html',
  '/prd/index.html',
  '/prd/PRD1-intelligent-triage.html',
  '/prd/PRD2-multi-brand-migration.html',
  '/prd/whatsapp-chatbot.html',
  '/prd/failover-mechanism.html',
  '/icebox/index.html',
  '/icebox/youtube-extension.html',
];

let missing = [];
for (const url of EXPECTED_URLS) {
  const filePath = path.join(SITE_DIR, url);
  if (!fs.existsSync(filePath)) {
    missing.push(url);
  }
}

if (missing.length > 0) {
  console.error('MISSING URLS:');
  missing.forEach(u => console.error(`  ${u}`));
  process.exit(1);
}

console.log(`All ${EXPECTED_URLS.length} expected URLs present in _site/.`);
```

Run: `node scripts/verify/check-url-parity.js`
Expected: `All 12 expected URLs present in _site/.`

- [ ] **Step 3: Write the content diff script**

Compares each baseline snapshot (Task 1) against the corresponding built output, ignoring whitespace-only differences, to catch accidental content loss during front-matter extraction.

```javascript
// scripts/verify/diff-content.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const BASELINE_DIR = path.join(ROOT, '.baseline');
const SITE_DIR = path.join(ROOT, '_site');

// Maps baseline path -> built _site path (paths diverge for migrated collection pages)
const PATH_MAP = {
  'index.html': 'index.html',
  'case/index.html': 'case/index.html',
  'case/CASE1-localization-proxy-tool.html': 'case/CASE1-localization-proxy-tool.html',
  'case/CASE2-tractable-migration.html': 'case/CASE2-tractable-migration.html',
  'case/amex-reporting.html': 'case/amex-reporting.html',
  'prd/index.html': 'prd/index.html',
  'prd/PRD1-intelligent-triage.html': 'prd/PRD1-intelligent-triage.html',
  'prd/PRD2-multi-brand-migration.html': 'prd/PRD2-multi-brand-migration.html',
  'prd/whatsapp-chatbot.html': 'prd/whatsapp-chatbot.html',
  'prd/failover-mechanism.html': 'prd/failover-mechanism.html',
  'icebox/index.html': 'icebox/index.html',
  'icebox/youtube-extension.html': 'icebox/youtube-extension.html',
};

function normalize(html) {
  return html
    .replace(/>\s+</g, '><')   // collapse whitespace between tags
    .replace(/\s+/g, ' ')      // collapse all whitespace runs
    .trim();
}

function extractBodyText(html) {
  // Strip head/nav/footer/script boilerplate that legitimately changes shape
  // (moved into shared includes); compare only the visible text content.
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  const body = match ? match[1] : html;
  return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

let failures = [];
for (const [baselineRel, siteRel] of Object.entries(PATH_MAP)) {
  const baselinePath = path.join(BASELINE_DIR, baselineRel);
  const sitePath = path.join(SITE_DIR, siteRel);

  if (!fs.existsSync(sitePath)) {
    failures.push(`${siteRel}: MISSING from _site/`);
    continue;
  }

  const baselineText = extractBodyText(fs.readFileSync(baselinePath, 'utf8'));
  const siteText = extractBodyText(fs.readFileSync(sitePath, 'utf8'));

  if (baselineText !== siteText) {
    failures.push(`${siteRel}: visible text content differs from baseline`);
  }
}

if (failures.length > 0) {
  console.error('CONTENT DIFFERENCES FOUND:');
  failures.forEach(f => console.error(`  ${f}`));
  process.exit(1);
}

console.log(`All ${Object.keys(PATH_MAP).length} pages match baseline visible content.`);
```

Run: `node scripts/verify/diff-content.js`
Expected: `All 12 pages match baseline visible content.` If it fails, open the flagged file, compare it manually against `.baseline/<same-path>`, and fix the migrated content (most likely cause: a paragraph or card field dropped during front-matter extraction).

- [ ] **Step 4: Write the internal link check script**

```javascript
// scripts/verify/check-links.js
const fs = require('fs');
const path = require('path');

const SITE_DIR = path.resolve(__dirname, '../../_site');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const htmlFiles = walk(SITE_DIR);
let brokenLinks = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const hrefMatches = [...html.matchAll(/href="(\/[^"#]*)"/g)];

  for (const [, href] of hrefMatches) {
    if (href.startsWith('//') || href.includes('.pdf')) continue; // external/protocol-relative/asset, skip
    let target = path.join(SITE_DIR, href);
    if (href.endsWith('/')) target = path.join(target, 'index.html');
    if (!fs.existsSync(target) && !fs.existsSync(target + '.html')) {
      brokenLinks.push(`${path.relative(SITE_DIR, file)} -> ${href}`);
    }
  }
}

if (brokenLinks.length > 0) {
  console.error('BROKEN INTERNAL LINKS:');
  brokenLinks.forEach(l => console.error(`  ${l}`));
  process.exit(1);
}

console.log(`No broken internal links found across ${htmlFiles.length} pages.`);
```

Run: `node scripts/verify/check-links.js`
Expected: `No broken internal links found across 12 pages.`

- [ ] **Step 5: Manual visual pass**

Run: `bundle exec jekyll serve`
Open `http://localhost:4000/` in a browser and check:
- Home page renders identically to before (hero, impact grid, what-I-do, work, experience, contact, footer).
- Nav shows the correct `.is-active` highlight on `/case/`, `/prd/`, and `/icebox/`.
- `/case/` and `/prd/` listing pages show all cards with correct company/date/title/tldr, and the "Sample" ribbon on `amex-reporting`, `failover-mechanism`, and `whatsapp-chatbot`.
- `/icebox/` shows all 3 cards, with only the YouTube one having a working "Full decision analysis →" link.
- One case study (`/case/amex-reporting.html`) shows the sample banner; one without `sample: true` (`/case/CASE1-localization-proxy-tool.html`) does not.

- [ ] **Step 6: Commit the verification scripts**

```bash
git add scripts/verify/check-url-parity.js scripts/verify/diff-content.js scripts/verify/check-links.js
git commit -m "Add URL parity, content diff, and link-check verification scripts"
```

---

### Task 10: Final cleanup and PR

**Files:**
- Modify: `.gitignore` (confirm `_site/`, `.jekyll-cache/`, `.baseline/` present)

- [ ] **Step 1: Confirm no orphaned old files remain**

Run: `git status --short`
Expected: no untracked old case/PRD HTML files left over from the pre-migration structure (they were deleted in Tasks 5-7 as part of the migration commits).

- [ ] **Step 2: Re-run the full verification suite one more time end-to-end**

```bash
bundle exec jekyll build
node scripts/verify/check-url-parity.js
node scripts/verify/diff-content.js
node scripts/verify/check-links.js
```

Expected: all three scripts print their success line with no errors.

- [ ] **Step 3: Push the branch**

```bash
git push -u origin jekyll-migration
```

- [ ] **Step 4: Open a PR for review (do not merge)**

```bash
gh pr create --title "Migrate to Jekyll: shared nav/head/footer + collections" --body "$(cat <<'EOF'
## Summary
- Introduces Jekyll (_config.yml, _includes, _layouts, collections) so nav/footer/head and case-study/PRD/Icebox listing cards are single-sourced instead of copy-pasted across 12 files.
- All existing URLs preserved exactly (verified via scripts/verify/check-url-parity.js).
- Visible page content verified unchanged (verified via scripts/verify/diff-content.js).
- No broken internal links (verified via scripts/verify/check-links.js).

## Test plan
- [x] `bundle exec jekyll build` completes cleanly
- [x] URL parity script passes (12/12 URLs present)
- [x] Content diff script passes (12/12 pages match pre-migration baseline)
- [x] Link check script passes (0 broken links)
- [x] Manual visual pass on home, case listing, PRD listing, Icebox listing, and one sample-banner case study

🤖 Generated with Claude Code
EOF
)"
```

Report the PR URL to the user. Do not merge — wait for explicit approval.

---

## Summary of Spec Coverage

- Shared nav/footer/head → Task 2, 3
- Active nav-link highlighting → Task 2 Step 2, 4
- Case study / PRD / Icebox collections → Tasks 5, 6, 7
- URL preservation → Tasks 5-7 (`permalink` front matter), verified in Task 9 Step 2
- Local `jekyll serve` preview → Task 9 Step 5
- Branch isolation, no CI needed, PR for review → Task 10
- Regression testing (build/URL/content/link checks) → Task 9
