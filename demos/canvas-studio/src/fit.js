'use strict';

/* Scale-to-fit for a fixed-width desktop page.
 *
 * These experiments were written for a desktop window: canvases are 600–1200 px wide,
 * the hover card is a 500 px block, and the drawing code carries hardcoded coordinates
 * (`{ x: 700, y: 300, ... }`). There is no responsive layout to add without rewriting
 * eight separate coordinate systems and re-tuning every scene by hand.
 *
 * So scale the page instead. Everything except the nav and the portfolio badge goes
 * into one wrapper, and that wrapper is CSS-scaled to fit the viewport. The drawing
 * code never learns anything changed, and pointer input still lands correctly: both
 * Fabric.js and Konva map pointers through getBoundingClientRect(), which reports
 * post-transform geometry. That is the whole reason this is a CSS transform and not a
 * canvas resize.
 *
 * Page-level rather than per-canvas because the first attempt measured available width
 * from the wrapper's parent — and the parent had already been stretched by the very
 * overflow being corrected, so the scale always came out as 1. The viewport is the only
 * width that does not move when the content does.
 */

const GUTTER = 8;
const EXCLUDE = '.demo-nav, .pf-badge';

let page = null;
let natural = null;

function wrapPage() {
  if (page) return page;

  const wrap = document.createElement('div');
  wrap.className = 'fit-page';

  const moving = [...document.body.children].filter(
    (el) => !el.matches(EXCLUDE) && el.tagName !== 'SCRIPT'
  );
  if (moving.length === 0) return null;

  document.body.append(wrap);
  wrap.append(...moving);

  page = wrap;
  return wrap;
}

function apply() {
  const wrap = wrapPage();
  if (!wrap) return;

  // Measure unscaled. Reading scrollWidth while a transform is applied still reports
  // layout (pre-transform) size, but clearing first keeps this honest if that changes.
  wrap.style.transform = '';
  wrap.style.width = '';
  wrap.style.height = '';

  const width = wrap.scrollWidth;
  const height = wrap.scrollHeight;
  if (!width || !height) return;

  // Cache the widest natural size seen: a canvas that sizes itself to the window
  // would otherwise shrink the target on every resize and ratchet the scale down.
  if (!natural || width > natural.width) natural = { width, height };

  const viewport = document.documentElement.clientWidth;

  // Only scale when the content genuinely exceeds the viewport. Comparing against
  // (viewport - GUTTER) instead would put a 0.994 scale on any page whose content is
  // exactly window-width — blurring text to save eight pixels.
  if (natural.width <= viewport) {
    natural = null; // desktop: forget the cache so a later resize re-measures cleanly
    return;
  }

  const scale = (viewport - GUTTER) / natural.width;

  wrap.style.transform = `scale(${scale})`;
  // Collapse the box to its post-scale size, or the untransformed height leaves a
  // dead gap below the content and the page scrolls into nothing.
  wrap.style.width = `${natural.width}px`;
  wrap.style.height = `${height * scale}px`;
}

function start() {
  apply();
  // Konva, Fabric and Chart.js all mount canvases after their own init, and several
  // pages size their canvas in a script that runs after this one.
  requestAnimationFrame(apply);
  setTimeout(apply, 400);
  window.addEventListener('resize', apply, { passive: true });
  window.addEventListener('orientationchange', apply, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
