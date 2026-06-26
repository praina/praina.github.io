/* ============================================================
   main.js — shared interactions for all pages
   ============================================================ */

/* ── Mobile nav ──────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const mobileOverlay = document.getElementById('mobileOverlay');

if (hamburger && mobileOverlay) {
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    mobileOverlay.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileOverlay.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('click', closeMobileNav);
  });
}

function closeMobileNav() {
  if (!hamburger) return;
  hamburger.classList.remove('open');
  mobileOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Scroll reveal ───────────────────────────────────────── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
);

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

/* ── Animated counters ───────────────────────────────────── */
function parseCountTarget(str) {
  // Extracts prefix (e.g. "~"), suffix (e.g. "%", "+"), decimal places, and numeric value
  const m = str.match(/^([^0-9]*)(\d+(?:\.\d+)?)([^0-9]*)$/);
  if (!m) return null;
  const [, pre, num, suf] = m;
  const val = parseFloat(num);
  const decimals = (num.includes('.') ? num.split('.')[1].length : 0);
  return { pre, suf, val, decimals };
}

function animateCounter(el) {
  if (el.dataset.counted) return;
  el.dataset.counted = '1';
  const parsed = parseCountTarget(el.dataset.count);
  if (!parsed) return;
  const { pre, suf, val, decimals } = parsed;
  const duration = 1100;
  const start = performance.now();

  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const current = (eased * val).toFixed(decimals);
    el.textContent = pre + current + suf;
    if (p < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        counterObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

/* ── Expand / collapse toggle (e.g. "Show all N" sections) ─── */
document.querySelectorAll('[data-toggle-target]').forEach(btn => {
  const target = document.getElementById(btn.dataset.toggleTarget);
  if (!target) return;
  const labelMore = btn.dataset.labelMore || btn.textContent;
  const labelLess = btn.dataset.labelLess || 'Show less';
  btn.addEventListener('click', () => {
    const expanded = target.classList.toggle('is-expanded');
    btn.textContent = expanded ? labelLess : labelMore;
  });
});

/* ── "Next case study" link, derived from case/index.html row order ──
   The order of <a class="prd-list__row"> rows on /case/index.html is the
   single source of truth. Reordering case studies only means reordering
   those rows; every page's "next" link follows automatically. */
const caseNextLink = document.querySelector('.case__next');
if (caseNextLink) {
  fetch('index.html')
    .then(r => r.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = Array.from(doc.querySelectorAll('a.prd-list__row')).map(a => ({
        href: a.getAttribute('href'),
        title: a.querySelector('.prd-list__row-title')?.textContent.trim() || ''
      }));
      const currentFile = location.pathname.split('/').pop();
      const currentIndex = rows.findIndex(r => r.href === currentFile);
      if (currentIndex === -1) return;
      const next = rows[(currentIndex + 1) % rows.length];
      caseNextLink.setAttribute('href', next.href);
      const titleEl = caseNextLink.querySelector('.case__next-title');
      if (titleEl) titleEl.textContent = next.title;
    })
    .catch(() => {});
}
