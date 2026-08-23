/* Portfolio build badge.
   Master copy — demos get a copy at demos/<slug>/portfolio/badge.js.

   Configure per demo with data attributes on <body>:
     <body data-pf-badge-text="Portfolio build — mock data" data-pf-badge-back="../../">

   On <body>, not on the script tag: `document.currentScript` is always null in a
   module, and the src-suffix fallback breaks the moment a bundler emits the file as
   assets/badge-<hash>.js. Reading the body survives both.

   data-text defaults to "Portfolio build". Say "mock data" only where there IS mock
   data; a demo with no backend never had any, and claiming otherwise is a small lie
   a reviewer can check.
   data-back, when present, renders a link back to the index. Omit it and the badge
   is text only.

   Placement: if the page marks an element with [data-pf-badge-anchor], the badge is
   absolutely positioned inside it; otherwise it is fixed to the window corner. Anchor
   it to the 3D viewport, not the body — a body-fixed badge lands on top of the app's
   own chrome once a responsive layout stacks a sidebar under the canvas. */

const KEY = 'pf-badge-dismissed';

function config() {
  const d = document.body?.dataset ?? {};
  return { text: d.pfBadgeText || 'Portfolio build', back: d.pfBadgeBack || '' };
}

function mount() {
  if (sessionStorage.getItem(KEY) === '1') return;

  const { text, back } = config();
  const anchor = document.querySelector('[data-pf-badge-anchor]');

  const el = document.createElement('div');
  el.className = anchor ? 'pf-badge pf-badge--anchored' : 'pf-badge';
  // Not role="alert": this must never steal focus or interrupt a screen reader
  // mid-sentence. It is ambient context, so it announces politely or not at all.
  el.setAttribute('role', 'note');

  const dot = document.createElement('span');
  dot.className = 'pf-badge__dot';
  dot.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'pf-badge__text';
  label.textContent = text;

  if (back) {
    label.append(' · ');
    const link = document.createElement('a');
    link.className = 'pf-badge__link';
    link.href = back;
    link.textContent = 'All demos';
    label.append(link);
  }

  const close = document.createElement('button');
  close.className = 'pf-badge__close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Dismiss portfolio notice');
  close.textContent = '×';
  close.addEventListener('click', () => {
    sessionStorage.setItem(KEY, '1');
    el.remove();
  });

  el.append(dot, label, close);
  (anchor ?? document.body).append(el);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
