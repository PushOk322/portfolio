'use strict';
/* global dat */

//#region PUBLIC VALUES

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { changeGlobalMorph } from './system/morphSystem.js';
import { resolveAsset } from './asset-paths.js';

import {
  TONE_MAPPING_EXPOSURE,
  TONE_MAPPING_TYPE,
  SHADOWS_ENABLED,
  SHADOW_MAP_TYPE,
  POINTLIGHT_INTENSITY,
  POINTLIGHT_COLOR,
  POINTLIGHT_1_POS_X,
  POINTLIGHT_1_POS_Y,
  POINTLIGHT_1_POS_Z,
  POINTLIGHT_2_POS_X,
  POINTLIGHT_2_POS_Y,
  POINTLIGHT_2_POS_Z,
  POINTLIGHT_CAST_SHADOW,
  POINTLIGHT_SHADOW_BIAS,
  POINTLIGHT_SHADOW_NORMAL_BIAS,
  POINTLIGHT_SHADOW_RADIUS,
  POINTLIGHT_SHADOW_MAP_SIZE,
  DIRLIGHT_INTENSITY,
  DIRLIGHT_COLOR,
  DIRLIGHT_POS_X,
  DIRLIGHT_POS_Y,
  DIRLIGHT_POS_Z,
  DIRLIGHT_TARGET_X,
  DIRLIGHT_TARGET_Y,
  DIRLIGHT_TARGET_Z,
  DIRLIGHT_CAST_SHADOW,
  DIRLIGHT_SHADOW_BIAS,
  DIRLIGHT_SHADOW_NORMAL_BIAS,
  DIRLIGHT_SHADOW_RADIUS,
  DIRLIGHT_SHADOW_MAP_SIZE,
  DIRLIGHT_SHADOW_AUTOFIT,
  DIRLIGHT_SHADOW_CAMERA_SIZE,
  DIRLIGHT_SHADOW_CAMERA_NEAR,
  DIRLIGHT_SHADOW_CAMERA_FAR,
  AMBIENTLIGHT_COLOR,
  AMBIENTLIGHT_INTENSITY,
  ENVIRONMENT_MAP_ROTATEBLE,
  ENVIRONMENT_MAP_ANGLE,
  ENVIRONMENT_MAP_FLIP_X,
  BACKGROUND_COLOR,
  ENVIRONMENT_MAP,
  ENVIRONMENT_MAP_INTENSITY,
  MODEL_CENTER_POSITION,
  CONTROL_TARGET_POSITION_Y,
  START_CAMERA_POSITION,
  SHADOW_TRANSPARENCY,
  ADD_POINTLIGHT,
  ADD_DIRLIGHT,
  ADD_AMBIENTLIGHT,
  ADD_FLOOR,
  GUI_MODE_LIGHTING,
  DEV_MODE_HELPERS,
  RENDER_SCALE,
  IDLE_RENDER_BOOST,
  INTERACTIVE_PIXEL_RATIO,
  IDLE_PIXEL_RATIO,
  ENABLE_POST_PROCESSING,
  ANTIALIAS_MODE,
  COMPOSER_MSAA_SAMPLES,
  CONTROLS_ENABLE_PAN,
  CONTROLS_FIX_VERTICAL_PAN,
  ENABLE_ASSEMBLY_ANIMATION,
} from './settings.js';

const isNewThreeJs = parseInt(THREE.REVISION) >= 150;

export let floor;
const correctionFloor = 0;
let floorMaterial;

// Resolved by create3DScene() rather than at import time: an embedder mounts
// into a container we are handed, and reading the DOM on module evaluation
// would force them to hand-author our markup before loading the script.
export let canvas;

export let scene;
export let renderer;
export let composer;
export let camera;
export let controls;
export let envMap;
export let ambientLight;
export let dirLight;
export let dirLight2;
export let pointLight;
export let pointLight2;

export let gui;

let fxaaPass = null;

let morphFolder = null;
let sceneGraphFolder = null;

let currentEnvPath = ENVIRONMENT_MAP;

//#endregion

//#region DEVICE DETECTION and PERFORMANCE SELECTION

const isLowPerformance = isWeakDevice();
// const isLowPerformance = false;

function isWeakDevice() {
  if (navigator.hardwareConcurrency < 4) return true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      const renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      if (!/Intel/i.test(renderer)) return false;
      const isModernIntel = /Iris\s?Xe/i.test(renderer) || /Arc/i.test(renderer);
      if (isModernIntel) return false;
      const isLegacyIntel = /HD\s?Graphics/i.test(renderer) ||
        /UHD\s?Graphics\s?6/i.test(renderer) ||
        (/Iris/i.test(renderer) && !/Xe/i.test(renderer));
      if (isLegacyIntel) return true;
    }
    // eslint-disable-next-line no-unused-vars
  } catch (e) { return false; }
  return false;
}

export function getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (/Macintosh/i.test(userAgent)) {
    return "Macintosh";
  }

  if (/Windows/i.test(userAgent) || /Win/i.test(userAgent)) {
    return "Windows";
  }

  if (/windows phone/i.test(userAgent)) {
    return "Windows Phone";
  }

  if (/android/i.test(userAgent)) {
    return "Android";
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return "iOS";
  }

  return "unknown";
}

//#endregion

//#region RENDER REQUEST SETUP

let renderRequested = false;
let renderPaused = false;

// Idle-boost pixel-ratio state (see IDLE_RENDER_BOOST in settings.js)
let interactivePixelRatio = 1;
let idlePixelRatio = 2;
let currentPixelRatioMode = null; // 'idle' | 'interactive'
let controlsWereMoving = false;

// Swap between the cheap interactive pixel ratio and the crisp idle one.
// The actual buffer resize is applied by resizeRendererToDisplaySize() on the
// next rendered frame, which already reacts to a changed renderer pixel ratio.
function setRenderQuality(mode) {
  if (!renderer || currentPixelRatioMode === mode) return;
  currentPixelRatioMode = mode;
  renderer.setPixelRatio(mode === 'idle' ? idlePixelRatio : interactivePixelRatio);
  requestRender();
}

export function requestRender() {
  if (!renderRequested) {
    renderRequested = true;
  }
}

/** Held while a static image covers the canvas — no reason to keep drawing. */
export function setRenderPaused(paused) {
  renderPaused = paused;
  if (!paused) requestRender();
}

export function requestDelayedRender() {
  requestRender();
  setTimeout(requestRender, 50);
  setTimeout(requestRender, 100);
  setTimeout(requestRender, 500);
  setTimeout(requestRender, 1000);
}
//#endregion

//#region SCENE COMPONENTS

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND_COLOR || 0xffffff);
  if (DEV_MODE_HELPERS) {
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);
  }
  window.scene = scene;
}

function initCamera() {
  const startCameraPosition = new THREE.Vector3(
    START_CAMERA_POSITION[0],
    START_CAMERA_POSITION[1],
    START_CAMERA_POSITION[2]
  );

  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
  startCameraPosition && camera.position.copy(startCameraPosition);
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.shadowMap.enabled = SHADOWS_ENABLED;
  renderer.shadowMap.type = SHADOW_MAP_TYPES[SHADOW_MAP_TYPE] ?? THREE.PCFShadowMap;

  const dpr = window.devicePixelRatio || 1;
  const renderScale = isLowPerformance ? 0.9 : RENDER_SCALE;

  if (IDLE_RENDER_BOOST) {
    // Interactive: clamp to native res — supersampling a moving frame is wasteful.
    const interactiveCap = isLowPerformance ? 1 : INTERACTIVE_PIXEL_RATIO;
    interactivePixelRatio = Math.min(dpr, interactiveCap) * renderScale;
    // Idle: allowed to exceed dpr (true SSAA on 1x screens). Capped for memory.
    const idleCap = isLowPerformance ? 1.5 : IDLE_PIXEL_RATIO;
    idlePixelRatio = Math.max(idleCap * renderScale, interactivePixelRatio);
    // Start crisp; the animate loop drops to interactive as soon as motion begins.
    currentPixelRatioMode = 'idle';
    renderer.setPixelRatio(idlePixelRatio);
  } else {
    const maxPixelRatio = isLowPerformance ? 1.5 : 2;
    const pixelRatio = Math.min(dpr, maxPixelRatio);
    renderer.setPixelRatio(pixelRatio * renderScale);
  }

  renderer.toneMapping = TONE_MAPPING_TYPES[TONE_MAPPING_TYPE] ?? THREE.LinearToneMapping;
  renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;

  if (isNewThreeJs) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.useLegacyLights = false;
  } else {
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
  }
}
export function updateRenderSize(forceResize = false) {
  if (!renderer) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio;
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);
  const needResize = renderer.domElement.width !== width || renderer.domElement.height !== height;

  if (needResize || forceResize) {
    renderer.setSize(width, height, false);
    updateComposerSize(); // composer.setSize wants CSS px (it applies pixelRatio itself)
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    controls.update();
  }
}

function initComposer() {
  if (!ENABLE_POST_PROCESSING) return;

  // MSAA render target so geometry edges get true multisampling — adding a
  // composer otherwise drops the renderer's built-in `antialias: true`. This is
  // the sharpness-preserving half of the AA: no interior-pixel blur at all.
  // HalfFloat keeps HDR range intact until OutputPass tone-maps.
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const samples = isLowPerformance ? 0 : COMPOSER_MSAA_SAMPLES;
  const renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: THREE.HalfFloatType,
    samples,
  });

  composer = new EffectComposer(renderer, renderTarget);
  composer.addPass(new RenderPass(scene, camera));
  // OutputPass (tone map + sRGB) must come BEFORE the AA pass: both SMAA and
  // FXAA do luma/pattern detection and expect sRGB input.
  composer.addPass(new OutputPass());

  fxaaPass = null;
  if (ANTIALIAS_MODE === 'smaa') {
    // Reconstructs edge patterns geometrically instead of blurring luma, so
    // fine detail (profile lines, gasket strips) stays sharp.
    composer.addPass(new SMAAPass());
  } else if (ANTIALIAS_MODE === 'fxaa') {
    fxaaPass = new ShaderPass(FXAAShader);
    composer.addPass(fxaaPass);
  }

  updateComposerSize();
}

function updateComposerSize() {
  if (!composer) return;
  const rect = canvas.getBoundingClientRect();
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(rect.width, rect.height);
  if (fxaaPass) {
    const pr = renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.set(
      1 / (rect.width * pr),
      1 / (rect.height * pr)
    );
  }
}

function initLights() {
  if (ADD_AMBIENTLIGHT) {
    ambientLight = new THREE.AmbientLight(AMBIENTLIGHT_COLOR, AMBIENTLIGHT_INTENSITY);
    scene.add(ambientLight);
  }

  if (ADD_DIRLIGHT) {
    dirLight = new THREE.DirectionalLight(DIRLIGHT_COLOR, DIRLIGHT_INTENSITY);
    dirLight.target.position.set(DIRLIGHT_TARGET_X, DIRLIGHT_TARGET_Y, DIRLIGHT_TARGET_Z);
    dirLight.target.updateMatrixWorld();
    dirLight.position.set(DIRLIGHT_POS_X, DIRLIGHT_POS_Y, DIRLIGHT_POS_Z);
    dirLight.castShadow = DIRLIGHT_CAST_SHADOW;
    dirLight.shadow.bias = DIRLIGHT_SHADOW_BIAS;
    dirLight.shadow.normalBias = DIRLIGHT_SHADOW_NORMAL_BIAS;
    dirLight.shadow.camera.left = -DIRLIGHT_SHADOW_CAMERA_SIZE;
    dirLight.shadow.camera.right = DIRLIGHT_SHADOW_CAMERA_SIZE;
    dirLight.shadow.camera.top = DIRLIGHT_SHADOW_CAMERA_SIZE;
    dirLight.shadow.camera.bottom = -DIRLIGHT_SHADOW_CAMERA_SIZE;
    dirLight.shadow.camera.near = DIRLIGHT_SHADOW_CAMERA_NEAR;
    dirLight.shadow.camera.far = DIRLIGHT_SHADOW_CAMERA_FAR;
    dirLight.shadow.camera.updateProjectionMatrix();

    const shadowSize = isLowPerformance ? DIRLIGHT_SHADOW_MAP_SIZE / 2 : DIRLIGHT_SHADOW_MAP_SIZE;
    dirLight.shadow.mapSize.set(shadowSize, shadowSize);
    dirLight.shadow.radius = DIRLIGHT_SHADOW_RADIUS;

    scene.add(dirLight);
    scene.add(dirLight.target);

    dirLight2 = new THREE.DirectionalLight(DIRLIGHT_COLOR, DIRLIGHT_INTENSITY);
    scene.add(dirLight2);
    scene.add(dirLight2.target);
    syncDirLight2();

    if (ADD_POINTLIGHT) {
      pointLight = new THREE.PointLight(POINTLIGHT_COLOR, POINTLIGHT_INTENSITY, 3, 0);
      pointLight.position.set(POINTLIGHT_1_POS_X, MODEL_CENTER_POSITION + POINTLIGHT_1_POS_Y, POINTLIGHT_1_POS_Z);
      applyPointLightShadowDefaults(pointLight);
      scene.add(pointLight);
      pointLight2 = new THREE.PointLight(POINTLIGHT_COLOR, POINTLIGHT_INTENSITY, 3, 0);
      pointLight2.position.set(POINTLIGHT_2_POS_X, MODEL_CENTER_POSITION + POINTLIGHT_2_POS_Y, POINTLIGHT_2_POS_Z);
      applyPointLightShadowDefaults(pointLight2);
      scene.add(pointLight2);
      const fillLight = new THREE.PointLight(POINTLIGHT_COLOR, POINTLIGHT_INTENSITY * 0.3, 4, 0);
      fillLight.position.set(0, MODEL_CENTER_POSITION + 1, -2);
      scene.add(fillLight);
    }
  }

  if (ADD_POINTLIGHT && !ADD_DIRLIGHT) {
    pointLight = new THREE.PointLight(POINTLIGHT_COLOR, POINTLIGHT_INTENSITY, 3, 0);
    pointLight.position.set(POINTLIGHT_1_POS_X, MODEL_CENTER_POSITION + POINTLIGHT_1_POS_Y, POINTLIGHT_1_POS_Z);
    applyPointLightShadowDefaults(pointLight);
    scene.add(pointLight);
    pointLight2 = new THREE.PointLight(POINTLIGHT_COLOR, POINTLIGHT_INTENSITY, 3, 0);
    pointLight2.position.set(POINTLIGHT_2_POS_X, MODEL_CENTER_POSITION + POINTLIGHT_2_POS_Y, POINTLIGHT_2_POS_Z);
    applyPointLightShadowDefaults(pointLight2);
    scene.add(pointLight2);
  }
}

// dirLight2 is a copy of dirLight placed at mirrored Z, lighting the back of the
// model. It has no settings of its own: every change to dirLight — GUI, preset,
// shadow refit — has to be followed by a call to this.
function syncDirLight2() {
  if (!dirLight || !dirLight2) return;

  dirLight2.intensity = dirLight.intensity * 2.5;
  dirLight2.color.copy(dirLight.color);
  dirLight2.castShadow = dirLight.castShadow;
  dirLight2.shadow.bias = dirLight.shadow.bias;
  dirLight2.shadow.normalBias = dirLight.shadow.normalBias;
  dirLight2.shadow.radius = dirLight.shadow.radius;

  const shadowSize = isLowPerformance ? DIRLIGHT_SHADOW_MAP_SIZE / 2 : DIRLIGHT_SHADOW_MAP_SIZE;
  dirLight.shadow.mapSize.set(shadowSize / 2, shadowSize / 2);

  dirLight2.shadow.camera.left = dirLight.shadow.camera.left;
  dirLight2.shadow.camera.right = dirLight.shadow.camera.right;
  dirLight2.shadow.camera.top = dirLight.shadow.camera.top;
  dirLight2.shadow.camera.bottom = dirLight.shadow.camera.bottom;
  dirLight2.shadow.camera.near = dirLight.shadow.camera.near;
  dirLight2.shadow.camera.far = dirLight.shadow.camera.far;
  dirLight2.shadow.camera.updateProjectionMatrix();

  dirLight2.target.position.copy(dirLight.target.position);
  dirLight2.target.updateMatrixWorld();
  dirLight2.position.set(dirLight.position.x, dirLight.position.y, -dirLight.position.z);
}

function applyPointLightShadowDefaults(light) {
  light.castShadow = POINTLIGHT_CAST_SHADOW;
  light.shadow.bias = POINTLIGHT_SHADOW_BIAS;
  light.shadow.normalBias = POINTLIGHT_SHADOW_NORMAL_BIAS;
  light.shadow.radius = POINTLIGHT_SHADOW_RADIUS;
  const mapSize = isLowPerformance ? POINTLIGHT_SHADOW_MAP_SIZE / 2 : POINTLIGHT_SHADOW_MAP_SIZE;
  light.shadow.mapSize.set(mapSize, mapSize);
}

function initFloor() {
  const floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
  floorMaterial = new THREE.ShadowMaterial();
  floorMaterial.opacity = SHADOW_TRANSPARENCY;
  floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.name = 'scene_floor';
  floor.rotation.x = -0.5 * Math.PI;
  floor.receiveShadow = true;
  floor.position.y = MODEL_CENTER_POSITION + correctionFloor;
  floor.frustumCulled = false;
  scene.add(floor);
}

export function updateEnvMap(path, intensity, angle = ENVIRONMENT_MAP_ANGLE, flipX = ENVIRONMENT_MAP_FLIP_X, updateSceneBackground = false) {
  if (path == null) { return; }

  currentEnvPath = path;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const hdrLoader = new HDRLoader();

  hdrLoader.load(resolveAsset(path), function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const envResElement = document.getElementById('info-env-res');
    if (envResElement && texture.image) {
      envResElement.textContent = `(${texture.image.width} x ${texture.image.height} px)`;
    }

    if (ENVIRONMENT_MAP_ROTATEBLE) {
      const sceneFlipped = new THREE.Scene();
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide
        })
      );
      sphere.scale.x = flipX ? 1 : -1;
      sceneFlipped.add(sphere);
      const radAngle = THREE.MathUtils.degToRad(180 - angle);
      sphere.rotation.y = radAngle;
      envMap = pmremGenerator.fromScene(sceneFlipped).texture;
    } else {
      envMap = pmremGenerator.fromEquirectangular(texture).texture;
    }

    scene.environment = envMap;

    if (isNewThreeJs) {
      scene.environmentIntensity = intensity;
    }

    if (updateSceneBackground) {
      scene.background = envMap;
    }

    if (!isNewThreeJs) {
      scene.traverse((object) => {
        if (object.isMesh && object.material) {
          if (object.material.envMap) {
            object.material.envMap = envMap;
            object.material.envMapIntensity = intensity;
            object.material.needsUpdate = true;
          }
        }
      });
    }

    texture.dispose();
    pmremGenerator.dispose();
    requestRender();
  });
}

function initEnvMap() {
  if (ENVIRONMENT_MAP && ENVIRONMENT_MAP !== '') {
    updateEnvMap(ENVIRONMENT_MAP, ENVIRONMENT_MAP_INTENSITY, ENVIRONMENT_MAP_ANGLE, ENVIRONMENT_MAP_FLIP_X);
  } else {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 1.2);
    hemiLight.position.set(0, 0, 0);
    scene.add(hemiLight);
  }
}

function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI / 2;
  controls.minAzimuthAngle = -Infinity;
  controls.maxAzimuthAngle = Infinity;
  // controls.enableDamping = !isLowPerformance;
  controls.enableDamping = true;
  controls.enablePan = CONTROLS_ENABLE_PAN;
  controls.dampingFactor = 0.25;
  controls.autoRotateSpeed = -0.5;
  controls.maxDistance = 50;
  controls.minDistance = 0.2;
  controls.autoRotate = false;
  controls.enableZoom = true;
  controls.target.set(0, CONTROL_TARGET_POSITION_Y, 0);

  if (DEV_MODE_HELPERS) {
    controls.enablePan = true;
    controls.minDistance = 0.01;
  }

  controls.addEventListener('change', () => {
    requestRender();
    if (CONTROLS_FIX_VERTICAL_PAN) { controls.target.y = CONTROL_TARGET_POSITION_Y; }
  });

  controls.addEventListener('end', () => {
    controls.autoRotate = false;

    if (DEV_MODE_HELPERS) {
      consoleLogPosition('camera', camera.position, 3);
      consoleLogPosition('target', controls.target, 3);
    }
  });

  function consoleLogPosition(text = '', pos, num = 2) {
    let k = 1;
    for (let i = 0; i < num; i++) {
      k = k * 10;
    }
    const x = Math.round(pos.x * k) / k;
    const y = Math.round(pos.y * k) / k;
    const z = Math.round(pos.z * k) / k;
    console.log('🚀 ' + text + ':[' + x + ', ' + y + ', ' + z + '],');
  }
}

function initAnimate() {
  let lastTime = performance.now();

  function animate(time) {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    if (renderPaused) return;

    const isControlsMoving = controls && controls.update();

    // Idle-boost: cheap while moving, one crisp supersampled frame when it stops.
    if (IDLE_RENDER_BOOST) {
      if (isControlsMoving) {
        setRenderQuality('interactive');
        controlsWereMoving = true;
      } else if (controlsWereMoving) {
        controlsWereMoving = false;
        setRenderQuality('idle'); // motion just settled -> render crisp
      }
    }

    if (renderRequested || isControlsMoving) {
      const delta = time - lastTime;
      const currentInterval = isLowPerformance ? (1000 / 30) : (1000 / 60);

      if (delta >= currentInterval) {
        lastTime = time - (delta % currentInterval);

        if (resizeRendererToDisplaySize(renderer)) {
          camera.aspect = canvas.clientWidth / canvas.clientHeight;
          // console.log("🚀 ~ animate ~ camera.aspect:", camera.aspect)
          camera.updateProjectionMatrix();
          updateComposerSize();
        }

        if (composer) { composer.render(); }
        else { renderer.render(scene, camera); }
        renderRequested = false;
      }
    }
  }
  requestAnimationFrame(animate);
}

function resizeRendererToDisplaySize(renderer) {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const canvasElement = renderer.domElement;
  const needResize = canvasElement.width !== width * renderer.getPixelRatio() ||
    canvasElement.height !== height * renderer.getPixelRatio();

  if (needResize) {
    renderer.setSize(width, height, false);
  }

  return needResize;
}

//#endregion

//#region //! MAIN
/**
 * @param {HTMLCanvasElement|HTMLElement|null} mountTarget  a canvas to render
 *   into, or a container to create one inside. Defaults to the demo page's
 *   #ar_model_view.
 */
export async function create3DScene(mountTarget = null) {
  canvas = resolveCanvas(mountTarget);
  if (!canvas) {
    throw new Error('[3DScene] No canvas to render into — pass a container to create3DScene().');
  }

  initScene();
  initCamera();
  initRenderer();
  initControls();
  initEnvMap();
  initLights();
  initComposer();
  (ADD_FLOOR) && initFloor();

  initAnimate();

  updateRenderSize();
  updateComposerSize();
  window.addEventListener('resize', () => {
    updateRenderSize();
    updateComposerSize();
    requestRender();
  });

  window.addEventListener('click', requestDelayedRender);
  window.addEventListener('touchstart', requestDelayedRender);
  window.addEventListener('input', requestRender);
  window.addEventListener('change', requestDelayedRender);

  (GUI_MODE_LIGHTING) && initGuiMode();
}

function resolveCanvas(target) {
  if (!target) return document.getElementById('ar_model_view');
  if (target instanceof HTMLCanvasElement) return target;

  const existing = target.querySelector?.('canvas');
  if (existing) return existing;

  const created = document.createElement('canvas');
  created.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;';
  target.appendChild(created);
  return created;
}
//#endregion

//#region MODEL LOADING FUNCTIONS

function processLoadedModel(model) {
  model.traverse((o) => {
    if (o.isMesh) {
      o.visible = true;
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;


      if (o.geometry.attributes.uv && !o.geometry.attributes.uv2) {
        o.geometry.setAttribute('uv', o.geometry.attributes.uv);
      }

      if (o.material.map) {
        o.material.map.anisotropy = isLowPerformance ? 4 : 16;
        if (isNewThreeJs) { o.material.map.colorSpace = THREE.SRGBColorSpace; }
        else { o.material.map.encoding = THREE.sRGBEncoding; }
        o.material.map.needsUpdate = true;
        o.material.needsUpdate = true;
        requestRender();
      }

      if (ENVIRONMENT_MAP !== '' && !isNewThreeJs) {
        o.material.envMap = envMap;
        o.material.envMapIntensity = ENVIRONMENT_MAP_INTENSITY;
        o.material.needsUpdate = true;
        requestRender();
      }
    }
  });

  const scale = 1;
  model.scale.set(scale, scale, scale);
  model.position.y = MODEL_CENTER_POSITION;

  model.updateMatrixWorld(true);

  const boundingBox = new THREE.Box3().setFromObject(model);
  const size = boundingBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  if (dirLight) {
    updateShadowCamera([model]);
    syncDirLight2();
  }

  // ------------------------------------------------------------
  if (camera && controls) {
    // fitCameraToObject(camera, model, controls, true);
  }

  if (ENABLE_ASSEMBLY_ANIMATION && window.gsap) {
    assembleModelAnimation(model, maxDim);
  }


}

// The product models are 4-15 MB, which is several seconds on a phone. A bare spinner
// for that long reads as a hang, so report the real byte progress. `total` is only
// present when the server sends Content-Length; without it, fall back to megabytes
// downloaded rather than showing a percentage that would be a guess.
function reportLoadProgress(event) {
  const el = document.getElementById('js-loader-progress');
  if (!el) return;

  el.textContent = event.lengthComputable && event.total
    ? `${Math.round((event.loaded / event.total) * 100)}%`
    : `${(event.loaded / 1048576).toFixed(1)} MB`;
}

export async function loadModel(url, needToAddToScene = true) {
  const loader = new GLTFLoader();
  const resolved = resolveAsset(url);
  try {
    const gltf = await loader.loadAsync(resolved, reportLoadProgress);
    const model = gltf.scene;

    model.animations = gltf.animations;

    processLoadedModel(model);
    (needToAddToScene) && scene.add(model);

    return model;
  } catch (error) {
    console.error(`Failed to load model from ${resolved}:`, error);
    return null;
  }
}

export function removeObject(object) {
  if (!object) return;
  scene.remove(object);
  object.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => disposeMaterial(mat));
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
}

function disposeMaterial(material) {
  material.dispose();
  for (const key in material) {
    if (material[key] && material[key].isTexture) {
      material[key].dispose();
    }
  }
}

//#endregion

//#region CAMERA and SHADOW CAMERA UPDATING and AMIMATION

// Refits the shadow frustum around the given objects. Gated behind
// DIRLIGHT_SHADOW_AUTOFIT because this runs on every model load — i.e. after
// both initLights() and the GUI have applied settings.js — so when it is on it
// has the last word on the frustum and there is no point tuning those values
// anywhere else. Shadow *quality* (radius, bias, normalBias) is never set here:
// it doesn't depend on model size, and writing it here is what made GUI-tuned
// values evaporate on reload.
export function updateShadowCamera(objectsToInclude, light = dirLight) {
  if (!DIRLIGHT_SHADOW_AUTOFIT) return;
  if (!light || !objectsToInclude || objectsToInclude.length === 0) return;

  const boundingBox = new THREE.Box3();
  objectsToInclude.forEach(object => {
    if (object) { boundingBox.expandByObject(object); }
  });

  if (boundingBox.isEmpty()) { return; }

  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  light.target.position.copy(center);
  light.target.updateMatrixWorld();

  const currentOffset = new THREE.Vector3().subVectors(light.position, center);
  const minDistance = maxDim * 1.5;
  if (currentOffset.length() < minDistance) {
    const direction = currentOffset.length() > 0.1 ? currentOffset.normalize() : new THREE.Vector3(0, 1, 0);
    light.position.copy(center).add(direction.multiplyScalar(minDistance));
  }

  const cameraSize = maxDim * 1.2;
  light.shadow.camera.left = -cameraSize;
  light.shadow.camera.right = cameraSize;
  light.shadow.camera.top = cameraSize;
  light.shadow.camera.bottom = -cameraSize;

  const dist = light.position.distanceTo(center);
  light.shadow.camera.near = DIRLIGHT_SHADOW_CAMERA_NEAR;
  light.shadow.camera.far = dist + maxDim * 3;

  light.shadow.camera.updateProjectionMatrix();
}


function assembleModelAnimation(model, maxDim) {
  const scatterRadius = maxDim * 1.5;
  let maxDuration = 0;

  model.traverse((child) => {
    if (child.isMesh) {
      const origPos = child.position.clone();
      const origRot = { x: child.rotation.x, y: child.rotation.y, z: child.rotation.z };
      const origScale = child.scale.clone();

      const randomDir = new THREE.Vector3(
        Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5
      ).normalize();

      const randomDist = Math.random() * scatterRadius + (scatterRadius * 0.5);
      child.position.add(randomDir.multiplyScalar(randomDist));
      child.scale.set(0.001, 0.001, 0.001);

      const delay = Math.random() * 1.2;
      const duration = 1 + Math.random() * 1.5;
      if (delay + duration > maxDuration) { maxDuration = delay + duration; }

      window.gsap.to(child.position, {
        x: origPos.x, y: origPos.y, z: origPos.z,
        duration: duration, delay: delay, ease: "back.out(1.2)"
      });
      window.gsap.to(child.rotation, {
        x: origRot.x, y: origRot.y, z: origRot.z,
        duration: duration, delay: delay, ease: "power2.out"
      });
      window.gsap.to(child.scale, {
        x: origScale.x, y: origScale.y, z: origScale.z,
        duration: duration, delay: delay, ease: "back.out(1.5)"
      });
    }
  });

  window.gsap.to({}, {
    duration: maxDuration,
    onUpdate: requestRender,
    onComplete: () => {
      model.updateMatrixWorld(true);
      updateShadowCamera([model]);
      requestDelayedRender();
    }
  });
}

//#endregion

//#region GUI

const TONE_MAPPING_TYPES = {
  None: THREE.NoToneMapping,
  Linear: THREE.LinearToneMapping,
  Reinhard: THREE.ReinhardToneMapping,
  Cineon: THREE.CineonToneMapping,
  ACESFilmic: THREE.ACESFilmicToneMapping,
  AgX: THREE.AgXToneMapping,
  Neutral: THREE.NeutralToneMapping,
};

const SHADOW_MAP_TYPES = {
  Basic: THREE.BasicShadowMap,
  PCF: THREE.PCFShadowMap,
  PCFSoft: THREE.PCFSoftShadowMap,
  VSM: THREE.VSMShadowMap,
};

const ENV_MAP_OPTIONS = {
  'Studio Small 01': './src/environment/studio_small_01_1k.hdr',
  'Studio Kontrast 02': './src/environment/studio_kontrast_02_1k.hdr',
  'Studio Wizja 02': './src/environment/studio_wizja_02_1k.hdr',
  'Blocky Photo Studio': './src/environment/blocky_photo_studio_1k.hdr',
  'Provence Studio': './src/environment/provence_studio_1k.hdr',
  'Lonely Road Afternoon': './src/environment/lonely_road_afternoon_1k.hdr',
  'Neutral': './src/environment/neutral.hdr',
};

function applyGuiSettings(settings) {
  if (renderer) {
    renderer.toneMappingExposure = settings.toneMappingExposure;
    renderer.toneMapping = TONE_MAPPING_TYPES[settings.toneMappingType] ?? THREE.LinearToneMapping;
    renderer.shadowMap.enabled = settings.shadowsEnabled;
    const shadowType = SHADOW_MAP_TYPES[settings.shadowMapType] ?? THREE.PCFShadowMap;
    if (renderer.shadowMap.type !== shadowType) {
      renderer.shadowMap.type = shadowType;
      renderer.shadowMap.needsUpdate = true;
    }
  }

  if (pointLight) {
    pointLight.intensity = settings.pointLightIntensity;
    pointLight.color.set(settings.pointLightColor);
    pointLight.castShadow = settings.pointLightCastShadow;
    pointLight.position.set(settings.pointLight1PosX, settings.pointLight1PosY, settings.pointLight1PosZ);
    pointLight.shadow.bias = settings.pointShadowBias;
    pointLight.shadow.normalBias = settings.pointShadowNormalBias;
    pointLight.shadow.radius = settings.pointShadowRadius;
    if (pointLight.shadow.mapSize.x !== settings.pointShadowMapSize) {
      pointLight.shadow.mapSize.set(settings.pointShadowMapSize, settings.pointShadowMapSize);
      if (pointLight.shadow.map) { pointLight.shadow.map.dispose(); pointLight.shadow.map = null; }
    }
  }
  if (pointLight2) {
    pointLight2.intensity = settings.pointLightIntensity;
    pointLight2.color.set(settings.pointLightColor);
    pointLight2.castShadow = settings.pointLightCastShadow;
    pointLight2.position.set(settings.pointLight2PosX, settings.pointLight2PosY, settings.pointLight2PosZ);
    pointLight2.shadow.bias = settings.pointShadowBias;
    pointLight2.shadow.normalBias = settings.pointShadowNormalBias;
    pointLight2.shadow.radius = settings.pointShadowRadius;
    if (pointLight2.shadow.mapSize.x !== settings.pointShadowMapSize) {
      pointLight2.shadow.mapSize.set(settings.pointShadowMapSize, settings.pointShadowMapSize);
      if (pointLight2.shadow.map) { pointLight2.shadow.map.dispose(); pointLight2.shadow.map = null; }
    }
  }

  if (ambientLight) {
    ambientLight.intensity = settings.ambientLightIntensity;
    ambientLight.color.set(settings.ambientLightColor);
  }

  if (dirLight) {
    dirLight.intensity = settings.directionalLightIntensity;
    dirLight.color.set(settings.directionalLightColor);
    dirLight.castShadow = settings.dirLightCastShadow;
    dirLight.shadow.bias = settings.dirShadowBias;
    dirLight.shadow.normalBias = settings.dirShadowNormalBias;
    dirLight.shadow.radius = settings.dirShadowRadius;
    if (dirLight.shadow.mapSize.x !== settings.dirShadowMapSize) {
      dirLight.shadow.mapSize.set(settings.dirShadowMapSize, settings.dirShadowMapSize);
      if (dirLight.shadow.map) { dirLight.shadow.map.dispose(); dirLight.shadow.map = null; }
    }
    dirLight.shadow.camera.left = -settings.dirShadowCameraSize;
    dirLight.shadow.camera.right = settings.dirShadowCameraSize;
    dirLight.shadow.camera.top = settings.dirShadowCameraSize;
    dirLight.shadow.camera.bottom = -settings.dirShadowCameraSize;
    dirLight.shadow.camera.near = settings.dirShadowCameraNear;
    dirLight.shadow.camera.far = settings.dirShadowCameraFar;
    dirLight.shadow.camera.updateProjectionMatrix();
    dirLight.target.position.set(settings.dirLightTargetX, settings.dirLightTargetY, settings.dirLightTargetZ);
    dirLight.target.updateMatrixWorld();
    dirLight.position.set(settings.dirLightPosX, settings.dirLightPosY, settings.dirLightPosZ);
    syncDirLight2();
  }

  if (floor && floorMaterial) {
    floorMaterial.opacity = settings.shadowTransparency;
    floor.visible = settings.floorVisible;
  }

  if (ENVIRONMENT_MAP) {
    if (isNewThreeJs) scene.environmentIntensity = settings.environmentMapIntensity;
    updateEnvMap(settings.environmentMapPath, settings.environmentMapIntensity, settings.environmentMapAngle, settings.environmentMapFlipX, false);
  }

  requestRender();
}

function updateGuiDisplay(folder) {
  if (folder.__controllers) folder.__controllers.forEach(c => c.updateDisplay());
  if (folder.__folders) Object.values(folder.__folders).forEach(updateGuiDisplay);
}

function initGuiMode() {
  gui = new dat.GUI();

  // Must mirror exactly what initRenderer()/initLights()/initFloor() applied
  // from settings.js — any drift here shows up as the scene changing the moment
  // the GUI is switched on.
  const defaultSettings = {
    toneMappingExposure: TONE_MAPPING_EXPOSURE,
    toneMappingType: TONE_MAPPING_TYPE,

    environmentMapPath: currentEnvPath,
    environmentMapAngle: ENVIRONMENT_MAP_ANGLE,
    environmentMapFlipX: ENVIRONMENT_MAP_FLIP_X,
    environmentMapIntensity: ENVIRONMENT_MAP_INTENSITY,

    pointLightIntensity: POINTLIGHT_INTENSITY,
    pointLightColor: POINTLIGHT_COLOR,
    pointLightCastShadow: POINTLIGHT_CAST_SHADOW,
    pointShadowBias: POINTLIGHT_SHADOW_BIAS,
    pointShadowNormalBias: POINTLIGHT_SHADOW_NORMAL_BIAS,
    pointShadowRadius: POINTLIGHT_SHADOW_RADIUS,
    pointShadowMapSize: isLowPerformance ? POINTLIGHT_SHADOW_MAP_SIZE / 2 : POINTLIGHT_SHADOW_MAP_SIZE,

    pointLight1PosX: POINTLIGHT_1_POS_X,
    pointLight1PosY: MODEL_CENTER_POSITION + POINTLIGHT_1_POS_Y,
    pointLight1PosZ: POINTLIGHT_1_POS_Z,
    pointLight2PosX: POINTLIGHT_2_POS_X,
    pointLight2PosY: MODEL_CENTER_POSITION + POINTLIGHT_2_POS_Y,
    pointLight2PosZ: POINTLIGHT_2_POS_Z,

    directionalLightIntensity: DIRLIGHT_INTENSITY,
    directionalLightColor: DIRLIGHT_COLOR,
    dirLightPosX: DIRLIGHT_POS_X,
    dirLightPosY: DIRLIGHT_POS_Y,
    dirLightPosZ: DIRLIGHT_POS_Z,
    dirLightTargetX: DIRLIGHT_TARGET_X,
    dirLightTargetY: DIRLIGHT_TARGET_Y,
    dirLightTargetZ: DIRLIGHT_TARGET_Z,
    dirLightCastShadow: DIRLIGHT_CAST_SHADOW,
    dirShadowBias: DIRLIGHT_SHADOW_BIAS,
    dirShadowNormalBias: DIRLIGHT_SHADOW_NORMAL_BIAS,
    dirShadowRadius: DIRLIGHT_SHADOW_RADIUS,
    dirShadowMapSize: isLowPerformance ? DIRLIGHT_SHADOW_MAP_SIZE / 2 : DIRLIGHT_SHADOW_MAP_SIZE,
    dirShadowCameraSize: DIRLIGHT_SHADOW_CAMERA_SIZE,
    dirShadowCameraNear: DIRLIGHT_SHADOW_CAMERA_NEAR,
    dirShadowCameraFar: DIRLIGHT_SHADOW_CAMERA_FAR,

    ambientLightIntensity: AMBIENTLIGHT_INTENSITY,
    ambientLightColor: AMBIENTLIGHT_COLOR,

    shadowsEnabled: SHADOWS_ENABLED,
    shadowMapType: SHADOW_MAP_TYPE,

    shadowTransparency: SHADOW_TRANSPARENCY,
    floorVisible: true,
  };

  // The scene already matches these values — initRenderer()/initLights() read
  // the same constants — so there is nothing to apply on open. The GUI edits
  // the live scene from here on; settings.js stays the only persisted source.
  const settings = { ...defaultSettings };

  // --- Rendering ---
  gui.add(settings, 'toneMappingExposure', 0, 4, 0.1).name('Exposure').onChange((value) => {
    if (renderer) renderer.toneMappingExposure = value;
    requestRender();
  });

  gui.add(settings, 'toneMappingType', Object.keys(TONE_MAPPING_TYPES)).name('Tone Mapping').onChange((value) => {
    if (renderer) renderer.toneMapping = TONE_MAPPING_TYPES[value];
    requestRender();
  });

  // --- Environment Map ---
  if (ENVIRONMENT_MAP) {
    const envFolder = gui.addFolder('Environment Map');

    envFolder.add(settings, 'environmentMapPath', ENV_MAP_OPTIONS).name('HDR').onChange((value) => {
      updateEnvMap(value, settings.environmentMapIntensity, settings.environmentMapAngle, settings.environmentMapFlipX, false);
    });

    envFolder.add(settings, 'environmentMapAngle', 0, 360, 1).name('Angle').onChange((value) => {
      if (ENVIRONMENT_MAP_ROTATEBLE) { updateEnvMap(settings.environmentMapPath, settings.environmentMapIntensity, value, settings.environmentMapFlipX, false); }
    });

    envFolder.add(settings, 'environmentMapFlipX').name('Flip X').onChange((value) => {
      if (ENVIRONMENT_MAP_ROTATEBLE) { updateEnvMap(settings.environmentMapPath, settings.environmentMapIntensity, settings.environmentMapAngle, value, false); }
    });

    envFolder.add(settings, 'environmentMapIntensity', 0, 7, 0.1).name('Intensity').onChange((value) => {
      if (isNewThreeJs) { scene.environmentIntensity = value; }
      else {
        scene.traverse((object) => {
          if (object.isMesh && object.material && object.material.envMap) {
            object.material.envMapIntensity = value;
            object.material.needsUpdate = true;
          }
        });
      }
      requestRender();
    });
  }

  // --- Directional Light ---
  if (ADD_DIRLIGHT && dirLight) {
    const dirFolder = gui.addFolder('Directional Light');

    dirFolder.add(settings, 'directionalLightIntensity', 0, 15, 0.1).name('Intensity').onChange((value) => {
      dirLight.intensity = value;
      syncDirLight2();
      requestRender();
    });

    dirFolder.addColor(settings, 'directionalLightColor').name('Color').onChange((value) => {
      dirLight.color.set(value);
      syncDirLight2();
      requestRender();
    });

    // Position and target are both absolute world coords, matching how
    // initLights() reads DIRLIGHT_POS_* / DIRLIGHT_TARGET_* from settings.js.
    const onLightPosChange = () => {
      dirLight.position.set(settings.dirLightPosX, settings.dirLightPosY, settings.dirLightPosZ);
      syncDirLight2();
      requestRender();
    };

    dirFolder.add(settings, 'dirLightPosX', -50, 50, 0.1).name('Position X').onChange(onLightPosChange);
    dirFolder.add(settings, 'dirLightPosY', -50, 50, 0.1).name('Position Y').onChange(onLightPosChange);
    dirFolder.add(settings, 'dirLightPosZ', -50, 50, 0.1).name('Position Z').onChange(onLightPosChange);

    const onLightTargetChange = () => {
      dirLight.target.position.set(settings.dirLightTargetX, settings.dirLightTargetY, settings.dirLightTargetZ);
      dirLight.target.updateMatrixWorld();
      syncDirLight2();
      requestRender();
    };

    dirFolder.add(settings, 'dirLightTargetX', -20, 20, 0.1).name('Target X').onChange(onLightTargetChange);
    dirFolder.add(settings, 'dirLightTargetY', -20, 20, 0.1).name('Target Y').onChange(onLightTargetChange);
    dirFolder.add(settings, 'dirLightTargetZ', -20, 20, 0.1).name('Target Z').onChange(onLightTargetChange);

    const dirShadowFolder = dirFolder.addFolder('Shadow');
    dirShadowFolder.add(settings, 'dirLightCastShadow').name('Cast Shadow').onChange((value) => {
      dirLight.castShadow = value;
      syncDirLight2();
      requestRender();
    });

    dirShadowFolder.add(settings, 'dirShadowBias', -0.01, 0.01, 0.0001).name('Bias').onChange((value) => {
      dirLight.shadow.bias = value;
      syncDirLight2();
      requestRender();
    });

    dirShadowFolder.add(settings, 'dirShadowNormalBias', 0, 0.2, 0.001).name('Normal Bias').onChange((value) => {
      dirLight.shadow.normalBias = value;
      syncDirLight2();
      requestRender();
    });

    dirShadowFolder.add(settings, 'dirShadowRadius', 0, 20, 0.5).name('Radius').onChange((value) => {
      dirLight.shadow.radius = value;
      syncDirLight2();
      requestRender();
    });

    dirShadowFolder.add(settings, 'dirShadowMapSize', [512, 1024, 2048, 4096]).name('Map Size').onChange((value) => {
      const size = parseInt(value, 10);
      settings.dirShadowMapSize = size;
      dirLight.shadow.mapSize.set(size, size);
      if (dirLight.shadow.map) { dirLight.shadow.map.dispose(); dirLight.shadow.map = null; }
      syncDirLight2();
      requestRender();
    });

    const onDirShadowCameraChange = () => {
      dirLight.shadow.camera.left = -settings.dirShadowCameraSize;
      dirLight.shadow.camera.right = settings.dirShadowCameraSize;
      dirLight.shadow.camera.top = settings.dirShadowCameraSize;
      dirLight.shadow.camera.bottom = -settings.dirShadowCameraSize;
      dirLight.shadow.camera.near = settings.dirShadowCameraNear;
      dirLight.shadow.camera.far = settings.dirShadowCameraFar;
      dirLight.shadow.camera.updateProjectionMatrix();
      syncDirLight2();
      requestRender();
    };

    dirShadowFolder.add(settings, 'dirShadowCameraSize', 0, 50, 0.5).name('Frustum Size').onChange(onDirShadowCameraChange);
    dirShadowFolder.add(settings, 'dirShadowCameraNear', 0.01, 20, 0.01).name('Camera Near').onChange(onDirShadowCameraChange);
    dirShadowFolder.add(settings, 'dirShadowCameraFar', 1, 500, 1).name('Camera Far').onChange(onDirShadowCameraChange);
  }

  // --- Point Lights ---
  if (ADD_POINTLIGHT) {
    const pointFolder = gui.addFolder('Point Lights');

    pointFolder.add(settings, 'pointLightIntensity', 0, 10, 0.1).name('Intensity').onChange((value) => {
      if (pointLight) pointLight.intensity = value;
      if (pointLight2) pointLight2.intensity = value;
      requestRender();
    });

    pointFolder.addColor(settings, 'pointLightColor').name('Color').onChange((value) => {
      if (pointLight) pointLight.color.set(value);
      if (pointLight2) pointLight2.color.set(value);
      requestRender();
    });

    pointFolder.add(settings, 'pointLightCastShadow').name('Cast Shadow').onChange((value) => {
      if (pointLight) pointLight.castShadow = value;
      if (pointLight2) pointLight2.castShadow = value;
      requestRender();
    });

    if (pointLight) {
      const point1Folder = pointFolder.addFolder('Light 1 Position');
      const onPoint1PosChange = () => {
        pointLight.position.set(settings.pointLight1PosX, settings.pointLight1PosY, settings.pointLight1PosZ);
        requestRender();
      };
      point1Folder.add(settings, 'pointLight1PosX', -20, 20, 0.1).name('Position X').onChange(onPoint1PosChange);
      point1Folder.add(settings, 'pointLight1PosY', -20, 20, 0.1).name('Position Y').onChange(onPoint1PosChange);
      point1Folder.add(settings, 'pointLight1PosZ', -20, 20, 0.1).name('Position Z').onChange(onPoint1PosChange);
    }

    if (pointLight2) {
      const point2Folder = pointFolder.addFolder('Light 2 Position');
      const onPoint2PosChange = () => {
        pointLight2.position.set(settings.pointLight2PosX, settings.pointLight2PosY, settings.pointLight2PosZ);
        requestRender();
      };
      point2Folder.add(settings, 'pointLight2PosX', -20, 20, 0.1).name('Position X').onChange(onPoint2PosChange);
      point2Folder.add(settings, 'pointLight2PosY', -20, 20, 0.1).name('Position Y').onChange(onPoint2PosChange);
      point2Folder.add(settings, 'pointLight2PosZ', -20, 20, 0.1).name('Position Z').onChange(onPoint2PosChange);
    }

    const pointShadowFolder = pointFolder.addFolder('Shadow');
    pointShadowFolder.add(settings, 'pointShadowBias', -0.01, 0.01, 0.0001).name('Bias').onChange((value) => {
      if (pointLight) pointLight.shadow.bias = value;
      if (pointLight2) pointLight2.shadow.bias = value;
      requestRender();
    });

    pointShadowFolder.add(settings, 'pointShadowNormalBias', 0, 0.2, 0.001).name('Normal Bias').onChange((value) => {
      if (pointLight) pointLight.shadow.normalBias = value;
      if (pointLight2) pointLight2.shadow.normalBias = value;
      requestRender();
    });

    pointShadowFolder.add(settings, 'pointShadowRadius', 0, 20, 0.5).name('Radius').onChange((value) => {
      if (pointLight) pointLight.shadow.radius = value;
      if (pointLight2) pointLight2.shadow.radius = value;
      requestRender();
    });

    pointShadowFolder.add(settings, 'pointShadowMapSize', [512, 1024, 2048, 4096]).name('Map Size').onChange((value) => {
      const size = parseInt(value, 10);
      settings.pointShadowMapSize = size;
      [pointLight, pointLight2].forEach((light) => {
        if (!light) return;
        light.shadow.mapSize.set(size, size);
        if (light.shadow.map) { light.shadow.map.dispose(); light.shadow.map = null; }
      });
      requestRender();
    });
  }

  // --- Ambient Light ---
  if (ADD_AMBIENTLIGHT) {
    const ambientFolder = gui.addFolder('Ambient Light');

    ambientFolder.add(settings, 'ambientLightIntensity', 0, 15, 0.1).name('Intensity').onChange((value) => {
      if (ambientLight) ambientLight.intensity = value;
      requestRender();
    });

    ambientFolder.addColor(settings, 'ambientLightColor').name('Color').onChange((value) => {
      if (ambientLight) ambientLight.color.set(value);
      requestRender();
    });
  }

  // --- Shadows (global) ---
  const shadowsFolder = gui.addFolder('Shadows');

  shadowsFolder.add(settings, 'shadowsEnabled').name('Enabled').onChange((value) => {
    if (renderer) { renderer.shadowMap.enabled = value; renderer.shadowMap.needsUpdate = true; }
    requestRender();
  });

  shadowsFolder.add(settings, 'shadowMapType', Object.keys(SHADOW_MAP_TYPES)).name('Type').onChange((value) => {
    if (renderer) {
      renderer.shadowMap.type = SHADOW_MAP_TYPES[value];
      renderer.shadowMap.needsUpdate = true;
      scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    }
    requestRender();
  });

  if (ADD_FLOOR && floor) {
    const floorFolder = gui.addFolder('Floor');
    settings.floorVisible = floor.visible;
    floorFolder.add(settings, 'floorVisible').name('Show Floor').onChange((value) => {
      if (floor) floor.visible = value;
      requestRender();
    });

    floorFolder.add(settings, 'shadowTransparency', 0, 1, 0.01).name('Shadow Opacity').onChange((value) => {
      if (floorMaterial) floorMaterial.opacity = value;
      requestRender();
    });
  }

  const resetSettings = {
    reset: () => {
      Object.assign(settings, defaultSettings);
      updateGuiDisplay(gui);
      applyGuiSettings(settings);
    }
  };

  gui.add(resetSettings, 'reset').name('RESET SETTINGS');

  gui.close();
}

export function updateTechInfoUI(model) {
  let meshesCount = 0;
  let verticesCount = 0;
  let trianglesCount = 0;
  let morphNames = new Set();

  model.traverse((node) => {
    if (node.isMesh) {
      meshesCount++;
      const geom = node.geometry;
      if (geom.attributes.position) {
        verticesCount += geom.attributes.position.count;
      }
      if (geom.index !== null) {
        trianglesCount += geom.index.count / 3;
      } else if (geom.attributes.position) {
        trianglesCount += geom.attributes.position.count / 3;
      }
      if (node.morphTargetDictionary) {
        Object.keys(node.morphTargetDictionary).forEach(k => morphNames.add(k));
      }
    }
  });

  const animsText = (model.animations && model.animations.length > 0)
    ? model.animations.map(a => a.name || 'Unnamed').join(', ')
    : 'None';

  const morphsText = morphNames.size > 0 ? Array.from(morphNames).join(', ') : 'None';

  document.getElementById('tech-meshes').textContent = meshesCount;
  document.getElementById('tech-vertices').textContent = verticesCount.toLocaleString();
  document.getElementById('tech-triangles').textContent = trianglesCount.toLocaleString();
  document.getElementById('tech-animations').textContent = animsText;
  document.getElementById('tech-morphs').textContent = morphsText;
}

export function updateModelGui(model) {
  if (!gui) return;

  if (morphFolder) { gui.removeFolder(morphFolder); morphFolder = null; }
  if (sceneGraphFolder) { gui.removeFolder(sceneGraphFolder); sceneGraphFolder = null; }

  let morphNames = new Set();
  model.traverse(node => {
    if (node.isMesh && node.morphTargetDictionary) {
      Object.keys(node.morphTargetDictionary).forEach(k => morphNames.add(k));
    }
  });

  if (morphNames.size > 0) {
    morphFolder = gui.addFolder('Morph Targets');

    const morphData = {};

    morphNames.forEach(name => {
      morphData[name] = 0;
      morphFolder.add(morphData, name, 0, 1, 0.01).onChange(val => {
        changeGlobalMorph(name, val);
      });
    });
  }

  sceneGraphFolder = gui.addFolder('Scene Graph');
  const masterData = { showAllMeshes: true };

  let meshCount = 0;
  model.traverse(n => { if (n.isMesh) meshCount++; });

  if (meshCount === 0) return;

  sceneGraphFolder.add(masterData, 'showAllMeshes').name('Show All Meshes').onChange(val => {
    model.traverse(node => {
      if (node.isMesh && node.name !== 'scene_floor') {
        node.visible = val;
      }
    });
    requestRender();
  });

  if (meshCount <= 300) {
    buildGuiTree(sceneGraphFolder, model, model);
  } else {
    console.warn(`Model has too many meshes (${meshCount}). Detailed tree view disabled.`);
  }
}

function buildGuiTree(parentFolder, node, rootModel) {
  const childrenWithMeshes = node.children.filter(c => {
    let hasMesh = false;
    c.traverse(n => { if (n.isMesh) hasMesh = true; });
    return hasMesh;
  });

  if (childrenWithMeshes.length === 0) return;

  let currentFolder = parentFolder;
  if (node !== rootModel && childrenWithMeshes.length > 0) {
    const folderName = node.name || `Group_${node.id}`;
    currentFolder = parentFolder.addFolder(folderName);
  }

  childrenWithMeshes.forEach(child => {
    if (child.isMesh) {
      const guiLabel = (child.name || 'Mesh') + `[${child.id}]`;

      currentFolder.add(child, 'visible').name(guiLabel).onChange(() => {
        requestRender();
      }).listen();
    } else {
      buildGuiTree(currentFolder, child, rootModel);
    }
  });
}

//#endregion
