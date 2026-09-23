'use strict';

import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

import { encodeText, toDataURL } from '../libs/qr/qrcode.js';

// AR is a view-layer concern like 3d-controller: it imports three and touches the DOM, so
// it has no Node tests (verify in the browser). It exports the assembled staircase to a GLB
// and hands it to a <model-viewer>, which drives Scene Viewer / Quick Look on a phone. On a
// desktop, where no AR surface exists, it falls back to a QR of the URL to scan — the old
// project's flow, minus its CDN.

let getRoot = null;
let modelViewer = null;
let exporter = null;
let activeBlobUrl = null;

export function initAR({ getRoot: rootAccessor, modelViewerEl }) {
  getRoot = rootAccessor;
  modelViewer = modelViewerEl;
  exporter = new GLTFExporter();
}

// True only where model-viewer can actually launch AR — a phone. Requires the model to be
// loaded first, so callers must export before asking.
export function canLaunchAR() {
  return Boolean(modelViewer?.canActivateAR);
}

// Export the current scene, load it into the viewer, then either launch AR (phone) or return
// a QR data URL for `shareUrl` (desktop). One entry point so the caller does not have to know
// which surface it landed on.
export async function openAR(shareUrl) {
  await loadCurrentSceneIntoViewer();

  if (canLaunchAR()) {
    await modelViewer.activateAR();
    return { launched: true };
  }

  return { launched: false, qrDataUrl: toDataURL(encodeText(shareUrl, 'M'), { scale: 6, margin: 4 }) };
}

async function loadCurrentSceneIntoViewer() {
  await customElements.whenDefined('model-viewer');

  const blob = await exportSceneToGlb();
  if (activeBlobUrl) URL.revokeObjectURL(activeBlobUrl);
  activeBlobUrl = URL.createObjectURL(blob);

  const loaded = waitForViewerLoad();
  modelViewer.src = activeBlobUrl;
  await loaded;
}

async function exportSceneToGlb() {
  const clone = getRoot().clone(true);

  // Seat the model on the floor: AR places the origin on the detected surface, and the
  // staircase is modelled from its ground floor up, so min.y is already ~0 — but a bracket
  // drop or a landing can dip below it. setFromObject is the right tool here (unlike the
  // camera fit): AR wants the morph-expanded visual bounds, which is exactly what it gives.
  clone.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(clone);
  clone.position.y -= box.min.y;
  clone.updateMatrixWorld(true);

  const glb = await exporter.parseAsync(clone, { binary: true });
  return new Blob([glb], { type: 'model/gltf-binary' });
}

function waitForViewerLoad() {
  return new Promise((resolve, reject) => {
    const onLoad = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('STAIRS_DEBUG ar: model-viewer failed to load the exported GLB')); };
    function cleanup() {
      modelViewer.removeEventListener('load', onLoad);
      modelViewer.removeEventListener('error', onError);
    }
    modelViewer.addEventListener('load', onLoad, { once: true });
    modelViewer.addEventListener('error', onError, { once: true });
  });
}
