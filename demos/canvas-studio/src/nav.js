'use strict';

/* Shared demo navigation.
 *
 * Nine separate HTML entry points with no links between them meant the Fabric.js
 * configurator — the reason this demo exists — was unreachable from the landing page.
 * This injects one strip on every page rather than pasting the same markup nine times.
 *
 * Order is deliberate: the two interactive builders first, then the generative pieces,
 * then the charts. A visitor should hit something they can drag before they hit a bar
 * chart. */

const PAGES = [
  { href: './index.html', label: 'T-shirt designer' },
  { href: './creature.html', label: 'Creature builder' },
  { href: './particles.html', label: 'Particles' },
  { href: './canvas.html', label: 'Starfield' },
  { href: './scroll.html', label: 'Scroll sequence' },
  { href: './hover-card.html', label: 'Hover card' },
  { href: './pie-diagram.html', label: 'Pie chart' },
  { href: './radar-diagram.html', label: 'Radar chart' },
  { href: './vertical-diagram.html', label: 'Bar chart' },
];

function currentFile() {
  const file = window.location.pathname.split('/').pop();
  return file === '' ? 'index.html' : file;
}

function build() {
  const here = currentFile();

  const nav = document.createElement('nav');
  nav.className = 'demo-nav';
  nav.setAttribute('aria-label', 'Canvas experiments');

  const list = document.createElement('ul');
  list.className = 'demo-nav__list';

  for (const page of PAGES) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'demo-nav__link';
    link.href = page.href;
    link.textContent = page.label;

    if (page.href.endsWith(here)) {
      link.classList.add('is-current');
      // aria-current, not just a class: the highlight has to reach a screen reader too.
      link.setAttribute('aria-current', 'page');
    }

    item.append(link);
    list.append(item);
  }

  nav.append(list);
  document.body.prepend(nav);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', build, { once: true });
} else {
  build();
}
