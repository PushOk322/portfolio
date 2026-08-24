'use strict';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

import {
  BACKGROUND_COLOR,
  CAMERA_FIT_PADDING,
  CAMERA_FOV,
  CAMERA_REFIT_DEBOUNCE_MS,
  CAMERA_VIEW_DIRECTION,
  ENVIRONMENT_MAP,
  ENVIRONMENT_MAP_INTENSITY,
  RENDER_MAX_PIXEL_RATIO,
  TONE_MAPPING_EXPOSURE,
} from '../settings.js';

//#region Module state

let scene = null;
let camera = null;
let renderer = null;
let controls = null;

let renderRequested = false;
// Must only latch on a frame that actually contains content — do not render
// before content exists, or waitForInitialSceneFrame resolves over an empty scene.
let initialFrameRendered = false;
let hasFramedOnce = false;
const initialFrameWaiters = [];

// The last object fitted, so a resize can re-fit it without 3d-scene reaching back
// into its caller.
let framedObject = null;
let refitTimer = 0;

//#endregion

//#region Renderer

function initRenderer(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDER_MAX_PIXEL_RATIO));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;
}

function resizeRendererToDisplaySize() {
  const canvas = renderer.domElement;
  const width = Math.floor(canvas.clientWidth);
  const height = Math.floor(canvas.clientHeight);
  if (width === 0 || height === 0) return false;

  // The drawing buffer is in device pixels (renderer.setSize multiplies by pixelRatio),
  // while clientWidth/Height are CSS pixels — comparing them directly makes this guard
  // decorative on any HiDPI display, resizing (and reallocating the buffer) every frame.
  const pixelRatio = renderer.getPixelRatio();
  const needsResize = canvas.width !== Math.floor(width * pixelRatio)
    || canvas.height !== Math.floor(height * pixelRatio);
  if (!needsResize) return false;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  return true;
}

//#endregion

//#region Camera and controls

function initCamera() {
  camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);
  camera.position.set(6, 4, 8);
}

function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.addEventListener('change', requestRender);
}

// Bounding-sphere fit: robust regardless of which axis dominates, which matters
// because the run swings ~35x across the control ranges. See spec §8.4.
export function fitCameraToObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;

  framedObject = object;

  // The first fit runs before any frame has rendered, so the camera still carries the
  // placeholder aspect of 1 rather than the canvas's real one. Fitting against that
  // puts the camera roughly half as far away as a narrow viewport needs.
  resizeRendererToDisplaySize();

  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const halfFovY = THREE.MathUtils.degToRad(camera.fov) / 2;
  const halfFovX = Math.atan(Math.tan(halfFovY) * camera.aspect);
  const distance = CAMERA_FIT_PADDING * Math.max(
    sphere.radius / Math.sin(halfFovY),
    sphere.radius / Math.sin(halfFovX),
  );

  // Keep whatever angle the user has orbited to; only distance and target re-fit. This
  // runs on the first layout and on canvas resizes — never on a state change — so resetting
  // the direction would yank the camera back to the canonical view mid-drag.
  const direction = hasFramedOnce
    ? camera.position.clone().sub(controls.target).normalize()
    : new THREE.Vector3(...CAMERA_VIEW_DIRECTION).normalize();
  hasFramedOnce = true;
  camera.position.copy(sphere.center).addScaledVector(direction, distance);
  camera.near = Math.max(0.01, distance / 100);
  camera.far = distance * 10;
  camera.updateProjectionMatrix();

  controls.target.copy(sphere.center);
  controls.update();
  requestRender();
}

//#endregion

//#region Environment

async function initEnvMap() {
  const texture = await new HDRLoader().loadAsync(ENVIRONMENT_MAP);
  texture.mapping = THREE.EquirectangularReflectionMapping;

  scene.environment = texture;
  scene.environmentIntensity = ENVIRONMENT_MAP_INTENSITY;
}

//#endregion

//#region Render on demand

export function requestRender() {
  if (renderRequested) return;

  renderRequested = true;
  requestAnimationFrame(renderFrame);
}

export function requestDelayedRender() {
  requestAnimationFrame(requestRender);
}

function renderFrame() {
  renderRequested = false;

  resizeRendererToDisplaySize();
  controls.update();
  renderer.render(scene, camera);

  if (initialFrameRendered) return;

  initialFrameRendered = true;
  for (const resolve of initialFrameWaiters.splice(0)) resolve();
}

export function waitForInitialSceneFrame() {
  if (initialFrameRendered) return Promise.resolve();
  return new Promise((resolve) => initialFrameWaiters.push(resolve));
}

//#endregion

//#region Lifecycle

export async function create3DScene(canvas) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND_COLOR);

  initCamera();
  initRenderer(canvas);
  initControls();
  await initEnvMap();

  observeCanvasSize(canvas);
}

// Observed, not listened for: the mobile drawer pushes the canvas through layout alone,
// which changes its size without ever firing a window resize.
function observeCanvasSize(canvas) {
  new ResizeObserver(() => {
    // Nothing framed yet means nothing to render — and rendering here would resolve
    // waitForInitialSceneFrame over an empty scene, hiding the loader early.
    if (!framedObject) return;

    resizeRendererToDisplaySize();
    requestRender();

    // The fit's Box3.setFromObject is far too heavy to run per frame while a window
    // edge is dragged or the drawer animates, so it waits for the motion to stop.
    clearTimeout(refitTimer);
    refitTimer = setTimeout(() => fitCameraToObject(framedObject), CAMERA_REFIT_DEBOUNCE_MS);
  }).observe(canvas);
}

export function addToScene(object) {
  scene.add(object);
  requestDelayedRender();
}

//#endregion
