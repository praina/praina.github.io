# Jekyll Migration Design

## Problem

The site is currently 12 static HTML pages with no build tooling. The nav, footer,
and `<head>` boilerplate (title, meta tags, analytics script) are copy-pasted
identically across every page. Changing the nav — as happened when removing
the "About" link — requires editing every page individually, which is error-prone
and easy to miss a file.

Additionally, the three listing pages (`case/index.html`, `prd/index.html`,
`icebox/index.html`) each hand-write a "card" (title, date, tags, excerpt) for
every entry, duplicating information that also lives on the entry's own page.
Adding or updating a case study/PRD/icebox item means editing two places by hand.

## Goals

1. Single-source the nav, footer, and `<head>` boilerplate across all pages.
2. Single-source case study / PRD / icebox listing cards via Jekyll collections,
   so adding a new entry means creating one file, not editing a listing page too.
3. Auto-highlight the active nav item based on current page.
4. Preserve every existing URL exactly (no link breakage, no SEO impact).
5. Support local preview (`jekyll serve`) before pushing, matching current workflow.
6. Zero risk to the live site during migration — all work on a separate branch,
   `main` untouched until explicit review and merge.

## Non-Goals

- No visual or content redesign — this is a structural migration only.
- No CI/GitHub Actions — GitHub Pages builds Jekyll natively, so none is needed.
- No migration of `css/`, `js/`, or the resume PDF — served as-is, untouched.

## Architecture

```
_config.yml
_includes/
  head.html       – title, meta description/OG tags, favicon, analytics script
  nav.html        – shared nav (desktop + mobile), active-link highlighting
  footer.html     – shared footer
_layouts/
  default.html    – head + nav + {{ content }} + footer
  case-study.html – default.html + case-study-specific wrapper markup
_case_studies/     (collection: case_studies)
  case1-localization-proxy-tool.html
  case2-tractable-migration.html
  amex-reporting.html
_prds/              (collection: prds)
  prd1-intelligent-triage.html
  prd2-multi-brand-migration.html
  whatsapp-chatbot.html
  failover-mechanism.html
_icebox/             (collection: icebox)
  youtube-extension.html
index.html                – default layout
case/index.html            – loops over site.case_studies
prd/index.html               – loops over site.prds
icebox/index.html             – loops over site.icebox
css/, js/, Prateek-Raina.pdf   – unchanged
```

### Includes & Layouts

- `head.html`: per-page `<title>`/description come from front matter
  (`title:`, `description:`), with sensible site-wide defaults if omitted.
- `nav.html`: identical markup to today, plus `page.url` comparison against
  each nav link's URL to add an `is-active` class — new capability, not
  present today.
- `footer.html`: unchanged from current markup.
- `default.html`: wraps head/nav/content/footer for index and listing pages.
- `case-study.html`: extends `default.html`, adds shared wrapper markup
  currently duplicated across case study/PRD pages.

### Collections & Front Matter

Each collection item retains its existing body content unchanged. Only
front matter is added at the top (title, date, tags, excerpt, layout).
Listing pages are rewritten once to loop over the collection and render a
shared card partial, replacing today's hand-written cards.

### URL Preservation

Collection folder names (`_case_studies/`, `_prds/`, `_icebox/`) are an
internal Jekyll convention and have no bearing on output URLs. Each
collection's `permalink` is explicitly set in `_config.yml` to reproduce
today's exact URLs (e.g. `/prd/whatsapp-chatbot.html`). Listing pages
(`/case/`, `/prd/`, `/icebox/`) remain plain pages at their current paths,
untouched by the collection folder naming.

## Testing & Verification Plan

This is a structural migration with no intended visual/content change, so
verification is regression-focused:

1. **Build check** — `jekyll build` completes with zero errors/warnings.
2. **URL parity check** — script comparing every current live URL against
   the built `_site/` output, confirming all existing paths still resolve
   identically (`/`, `/case/`, `/case/CASE1-...`, `/prd/`,
   `/prd/whatsapp-chatbot.html`, etc.)
3. **Content diff check** — diff each generated page's rendered HTML against
   the current page's HTML (ignoring whitespace-only differences) to catch
   any accidental content loss during front-matter extraction.
4. **Manual visual pass** — load home, one case study, one PRD, and one
   listing page in local preview; confirm nav (including active-highlight),
   footer, and cards render correctly.
5. **Link check** — crawl all internal links in the built site, confirm no
   404s.

## Branch & Rollout Strategy

- All work happens on a new branch (`jekyll-migration`), cut from current `main`.
- `main` is untouched for the entire migration — the live site keeps serving
  today's plain HTML with zero risk.
- Final step is a PR from `jekyll-migration` → `main` for explicit review and
  merge — no automatic merge.

## Open Risks

- Windows local Ruby/Jekyll setup requires a one-time installer; slightly more
  friction than Mac/Linux but a well-documented path (RubyInstaller + DevKit).
- GitHub Pages' supported Jekyll plugin list is a safe subset — no custom
  plugins are needed for this design, so no compatibility risk expected.
