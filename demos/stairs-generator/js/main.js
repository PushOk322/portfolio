'use strict';

import { createStateManager } from './core/state-manager.js';
import { getDefaultState, normalizeState, STAIRS_SCHEMA } from './core/stairs-state.js';
import { createUrlAdapter } from './core/url-adapter.js';
import { create3DScene, waitForInitialSceneFrame } from './scene/3d-scene.js';
import { init3DController, getStaircaseRoot } from './scene/3d-controller.js';
import { createUI } from './view/ui-controller.js';
import { initDrawer } from './view/drawer.js';
import { initAR, openAR } from './scene/ar-controller.js';

// directions is not a STAIRS_SCHEMA range key, so it is appended explicitly.
const PERSISTED_KEYS = [...Object.keys(STAIRS_SCHEMA), 'directions'];

start().catch((error) => {
  console.error('STAIRS_DEBUG boot failed:', error);
  showBootFailure();
});

async function start() {
  const stateManager = createStateManager({ defaults: getDefaultState(), normalize: normalizeState });
  const urlAdapter = createUrlAdapter({ keys: PERSISTED_KEYS });

  // URL beats defaults. Hydrate BEFORE registering the adapter, so reading a link
  // does not immediately rewrite it. See spec §10.
  stateManager.hydrate(await urlAdapter.read());
  stateManager.use(urlAdapter);

  await create3DScene(document.getElementById('scene-canvas'));
  await init3DController(stateManager);

  initAR({ getRoot: getStaircaseRoot, modelViewerEl: document.getElementById('ar-viewer') });

  createUI({ stateManager, mount: document.getElementById('controls-mount') });
  initViewportActions(stateManager, urlAdapter);
  initDrawer();

  await waitForInitialSceneFrame();
  hideLoader();

  // The scene exists now, so AR can never export an empty staircase. Enabling here mirrors
  // the loader latch. If the link that opened us asked for AR (a scanned QR), try to launch
  // straight into it — some browsers still need a tap, so the button stays as the fallback.
  const arButton = document.querySelector('[data-action="ar"]');
  if (arButton) arButton.disabled = false;
  if (new URLSearchParams(window.location.search).get('ar') === '1') {
    arButton?.click();
  }
}

function hideLoader() {
  document.getElementById('js-loader')?.classList.add('is-hidden');
}

function showBootFailure() {
  const loader = document.getElementById('js-loader');
  if (!loader) return;

  loader.textContent = 'Could not load the configurator. See the browser console.';
}

//#region Viewport actions

function initViewportActions(stateManager, urlAdapter) {
  document.querySelector('[data-action="reset"]')
    ?.addEventListener('click', () => stateManager.reset());

  initSharePopup(stateManager, urlAdapter);
  initArPopup(stateManager, urlAdapter);
}

function initArPopup(stateManager, urlAdapter) {
  const button = document.querySelector('[data-action="ar"]');
  const overlay = document.querySelector('[data-ar-overlay]');
  const qrImage = document.querySelector('[data-ar-qr]');
  if (!button || !overlay || !qrImage) return;

  let busy = false;

  function close() {
    overlay.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }

  async function open() {
    if (busy) return;
    busy = true;
    button.disabled = true;

    try {
      // Flush first so the QR and any Scene Viewer handoff carry the current config, then
      // tag the link with ar=1 so a scanned phone lands straight in AR.
      await urlAdapter.flush(stateManager.getAll());
      const url = new URL(window.location.href);
      url.searchParams.set('ar', '1');

      const result = await openAR(url.toString());
      if (!result.launched) {
        qrImage.src = result.qrDataUrl;
        overlay.hidden = false;
        button.setAttribute('aria-expanded', 'true');
      }
    } catch (error) {
      console.warn('STAIRS_DEBUG ar: could not open AR.', error);
    } finally {
      busy = false;
      button.disabled = false;
    }
  }

  button.addEventListener('click', () => { void open(); });
  document.querySelector('[data-ar-close]')?.addEventListener('click', close);
  overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
}

function initSharePopup(stateManager, urlAdapter) {
  const overlay = document.querySelector('[data-share-overlay]');
  const button = document.querySelector('[data-action="share"]');
  const link = document.querySelector('[data-share-link]');
  if (!overlay || !button || !link) return;

  async function open() {
    // Flush immediately: the debounced write may not have landed yet.
    await urlAdapter.flush(stateManager.getAll());
    link.value = window.location.href;
    overlay.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    link.select();
  }

  function close() {
    overlay.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }

  button.addEventListener('click', () => { void open(); });
  document.querySelector('[data-share-close]')?.addEventListener('click', close);
  overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });

  document.querySelector('[data-share-copy]')?.addEventListener('click', () => {
    void copyText(link.value, link);
  });
}

async function copyText(text, fallbackInput) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    fallbackInput.select();
    document.execCommand('copy');
  }
}

//#endregion
