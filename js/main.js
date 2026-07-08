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

/* ── Shared carousel engine (Impact / Skills / Recommendations) ──
   Handles auto-advance, dots, swipe navigation, and pause-while-
   pressed/hovered. Mobile-only carousels pass `mq` + `grid` to also
   lock the container to the tallest card's height. */
function initCarousel(opts) {
  const {
    cardSelector, trackSelector, dotsId, barId, dotClass, duration,
    mq = null, grid = null, onDeactivate = null, isHeld = null,
  } = opts;

  const cards  = Array.from(document.querySelectorAll(cardSelector));
  const track  = document.querySelector(trackSelector);
  const dotsEl = document.getElementById(dotsId);
  const bar    = document.getElementById(barId);
  if (!cards.length || !track || !dotsEl || !bar) return;

  let current = 0, barFrame = null, active = false, paused = false;
  let elapsed = 0, tickStart = null; // ms of progress banked so far / when the current run segment began
  let isMouseHovering = false;

  function syncHeight() {
    if (!grid) return;
    if (mq && !mq.matches) { grid.style.height = ''; return; }
    grid.style.height = 'auto';
    // Inactive cards are position:absolute with height:100%, which (once the
    // grid's auto height resolves via the one in-flow active card) resolves
    // against that SAME resolved height for every card — not each card's own
    // content. Override height inline per-card during measurement so each
    // reports its true independent content height, then restore the CSS rule.
    cards.forEach(c => { c.style.height = 'auto'; });
    const max = Math.max(...cards.map(c => c.offsetHeight));
    cards.forEach(c => { c.style.height = ''; });
    grid.style.height = max + 'px';
  }

  const dots = cards.map((_, i) => {
    const d = document.createElement('button');
    d.className = dotClass + (i === 0 ? ' is-active' : '');
    d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    d.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(d);
    return d;
  });

  function goTo(idx) {
    const prev = current;
    current = (idx + cards.length) % cards.length;
    if (prev === current) return;
    // syncHeight() does a real (if brief) layout read/write across every
    // card. The set of possible heights only changes on load, resize, or an
    // expand/collapse toggle — never just from switching which card is
    // shown — so only resync here if deactivating actually reverted an
    // expanded card back to its default state.
    const needsResync = onDeactivate ? !!onDeactivate(cards[prev]) : false;
    cards[prev].classList.remove('is-active');
    cards[current].classList.add('is-active');
    dots[prev].classList.remove('is-active');
    dots[current].classList.add('is-active');
    if (needsResync) syncHeight();
    resetBar();
  }

  function resetBar() {
    cancelAnimationFrame(barFrame);
    bar.style.width = '0%';
    elapsed = 0;
    tickStart = null;
    if (active && !paused) barFrame = requestAnimationFrame(tickBar);
  }

  function tickBar(ts) {
    if (!tickStart) tickStart = ts;
    const pct = Math.min((elapsed + (ts - tickStart)) / duration * 100, 100);
    bar.style.width = pct + '%';
    if (pct < 100) {
      barFrame = requestAnimationFrame(tickBar);
    } else {
      goTo(current + 1);
    }
  }

  function start() {
    if (active) return;
    active = true;
    if (!paused) { tickStart = null; barFrame = requestAnimationFrame(tickBar); }
  }

  function stop() {
    active = false;
    cancelAnimationFrame(barFrame);
    bar.style.width = '0%';
    elapsed = 0;
    tickStart = null;
  }

  function pause() {
    paused = true;
    cancelAnimationFrame(barFrame);
    if (tickStart) {
      elapsed += performance.now() - tickStart;
      tickStart = null;
    }
  }

  function resume() {
    if (isHeld && isHeld()) return;
    if (isMouseHovering) return;
    paused = false;
    tickStart = null;
    if (active) barFrame = requestAnimationFrame(tickBar);
  }

  /* Swipe navigation + pause while pressed (touch, mouse, or stylus) */
  let startX = null, startY = null;
  track.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
    pause();
  });
  track.addEventListener('pointerup', (e) => {
    if (startX !== null) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        goTo(dx < 0 ? current + 1 : current - 1);
      }
    }
    startX = null;
    resume();
  });
  track.addEventListener('pointercancel', () => { startX = null; resume(); });

  /* Desktop hover-pause. pointerenter/pointerleave with pointerType === 'mouse'
     correctly ignores synthetic events fired by touch and DevTools touch-
     simulation, where taps produce fake mouseenter with no matching mouseleave.
     isMouseHovering prevents resume() from firing on pointerup while the real
     cursor is still over the track. */
  track.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') { isMouseHovering = true; pause(); }
  });
  track.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') { isMouseHovering = false; resume(); }
  });

  if (mq) {
    const syncToViewport = (e) => { syncHeight(); if (e.matches) start(); else stop(); };
    syncToViewport(mq);
    mq.addEventListener('change', syncToViewport);
  } else {
    start();
  }

  if (grid) {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncHeight, 150);
    });
  }

  return { syncHeight, goTo, pause, resume };
}

const mq480 = window.matchMedia('(max-width: 480px)');

/* ── Impact stats carousel (mobile only, ≤480px) ─────────────── */
initCarousel({
  cardSelector: '.impact__card', trackSelector: '.impact__grid',
  dotsId: 'impactDots', barId: 'impactBar', dotClass: 'impact__dot',
  duration: 4000, mq: mq480, grid: document.querySelector('.impact__grid'),
});

/* ── Skills carousel (mobile only, ≤480px) ───────────────────── */
const skillsCarousel = initCarousel({
  cardSelector: '.skills__row', trackSelector: '.skills__rows',
  dotsId: 'skillsDots', barId: 'skillsBar', dotClass: 'skills__dot',
  duration: 5000, mq: mq480, grid: document.querySelector('.skills__rows'),
  onDeactivate(card) {
    const tags = card.querySelector('.skills__tags');
    const btn  = card.querySelector('.skills__more');
    if (tags && tags.classList.contains('is-expanded')) {
      tags.classList.remove('is-expanded');
      if (btn) btn.textContent = btn.dataset.labelMore || btn.textContent;
      return true; // height changed — grid needs a resync
    }
    return false;
  },
  isHeld() {
    const active = document.querySelector('.skills__row.is-active .skills__tags');
    return !!(active && active.classList.contains('is-expanded'));
  },
});

if (skillsCarousel) {
  document.querySelectorAll('.skills__more').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(() => {
      skillsCarousel.syncHeight();
      const tags = document.querySelector('.skills__row.is-active .skills__tags');
      if (tags && tags.classList.contains('is-expanded')) skillsCarousel.pause();
      else skillsCarousel.resume();
    }, 0));
  });
}

/* ── Recommendations carousel ───────────────────────────────── */
initCarousel({
  cardSelector: '.rec__card', trackSelector: '#recTrack',
  dotsId: 'recDots', barId: 'recBar', dotClass: 'rec__dot',
  duration: 6000,
});

(function () {
  function updateDots() {
    document.querySelectorAll('.rec__quote').forEach(function (q) {
      var wrap = q.parentElement;
      var existing = wrap.querySelector('.rec__overflow-dots');
      if (q.scrollHeight > q.clientHeight) {
        if (!existing) {
          var dots = document.createElement('span');
          dots.className = 'rec__overflow-dots';
          dots.setAttribute('aria-hidden', 'true');
          dots.textContent = '• • •';
          wrap.appendChild(dots);
        }
      } else {
        if (existing) existing.remove();
      }
    });
  }

  updateDots();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateDots, 150);
  });
})();

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
