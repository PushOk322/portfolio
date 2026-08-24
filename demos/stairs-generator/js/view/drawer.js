'use strict';

// The mobile controls drawer. Deliberately knows nothing about the scene: the sidebar is
// a flex child, so opening it resizes the canvas through layout, which 3d-scene observes.
export function initDrawer() {
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.querySelector('[data-drawer-toggle]');
  if (!sidebar || !toggle) return;

  function setOpen(isOpen) {
    sidebar.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  }

  toggle.addEventListener('click', () => {
    setOpen(!sidebar.classList.contains('is-open'));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}
