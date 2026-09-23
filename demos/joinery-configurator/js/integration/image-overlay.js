'use strict';

/**
 * Shows a static image over the canvas for products the 3D cannot build.
 *
 * The canvas is left in place and simply covered: mount() has already sized it,
 * and a later configuration swaps back without rebuilding the scene. Note this
 * sets `position: relative` on the host element if it lacks one, and never
 * reverts it — harmless, but a mutation of a container Joinery owns.
 */

import { setRenderPaused } from '../3d-scene.js';

let _img = null;

/**
 * @param {HTMLElement|HTMLCanvasElement} container  what mount() was given
 * @returns {Promise<boolean>} whether the image loaded
 */
export function showImage(container, url) {
  const host = container instanceof HTMLCanvasElement
    ? container.parentElement
    : container;

  if (!host) return Promise.resolve(false);

  // The host has to establish a containing block, or an absolutely positioned
  // child escapes to the viewport.
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

  if (!_img) {
    _img = document.createElement('img');
    _img.alt = '';
    _img.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:1;';
    host.appendChild(_img);
  }

  setRenderPaused(true);

  return new Promise(resolve => {
    _img.onload = () => resolve(true);
    _img.onerror = () => resolve(false);
    _img.src = url;
  });
}

export function hideImage() {
  if (!_img) return;

  _img.remove();
  _img = null;
  setRenderPaused(false);
}

export function isImageShowing() {
  return _img !== null;
}
