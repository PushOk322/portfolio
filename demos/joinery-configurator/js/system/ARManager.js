import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const state = {
  modelViewer: null,
  activeBlobUrl: null,
  originalSrc: null,
  injectedGroup: null,
  arPrompt: null,
  onExitCallback: null,

  generatedResources: {
    textures: [],
    geometries: [],
    materials: []
  },

  androidLightIntensity: 2.5,
  manualYOffset: 0,

  uvMatrix: [0, 0, 0, 0, 0, 0],
  materialsRepeat: [],
  materialsOffset: [],

  texOpt: {
    enabled: false,
    maxSize: 1024,
    format: 'image/jpeg',
    quality: 0.8
  },

  isARProcessing: false
};

export function init(modelViewerElement, options = {}) {
  state.modelViewer = modelViewerElement;
  state.originalSrc = modelViewerElement.getAttribute('src');

  if (options.androidLightIntensity !== undefined) state.androidLightIntensity = options.androidLightIntensity;
  if (options.arPrompt) state.arPrompt = options.arPrompt;
  if (options.onExitAR) state.onExitCallback = options.onExitAR;
  if (options.textureOptimization) {
    state.texOpt = { ...state.texOpt, ...options.textureOptimization };
  }

  _setupStatusListener();
  console.log("[ARManager] Initialized. Ready for v4.1");
}

export function setManualYOffset(value) { state.manualYOffset = value; }

export async function openAR(sceneToExport, uiShowQRPopup, uiShowSpinner, uiHideSpinner) {
  const device = getDeviceType();
  if (device === 'desktop') { uiShowQRPopup(); return; }
  if (state.isARProcessing) return;

  try {
    state.isARProcessing = true;
    if (uiShowSpinner) uiShowSpinner();

    fullCleanup();
    await new Promise(r => setTimeout(r, 50));

    const objectToInject = await rebuildObject(sceneToExport);

    if (!objectToInject) throw new Error("Object prep failed.");

    objectToInject.position.set(0, 0, 0);
    objectToInject.rotation.set(0, 0, 0);
    objectToInject.scale.set(1, 1, 1);
    objectToInject.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(objectToInject);
    objectToInject.position.y = (-box.min.y) + state.manualYOffset;
    objectToInject.updateMatrixWorld(true);

    if (device === 'ios') {
      console.log("[ARManager] iOS path: GLB Blob Generation");
      const blob = await generateGLBFromObject(objectToInject);
      const url = URL.createObjectURL(blob);
      state.activeBlobUrl = url;

      state.modelViewer.src = url;
      await waitForModelLoad();
    }
    else {
      console.log("[ARManager] Android path: Injection");
      _addAndroidSpecificLight(objectToInject);

      const success = injectIntoModelViewer(objectToInject);
      if (!success) {
        const blob = await generateGLBFromObject(objectToInject);
        state.activeBlobUrl = URL.createObjectURL(blob);
        state.modelViewer.src = state.activeBlobUrl;
        await waitForModelLoad();
      } else {
        if (state.modelViewer.updateFraming) {
            state.modelViewer.updateFraming();
        }
      }
    }

    if (uiHideSpinner) uiHideSpinner();

    await new Promise(r => setTimeout(r, 200));
    state.modelViewer.activateAR();

  } catch (e) {
    console.error("[ARManager] Critical Error:", e);
    if (uiHideSpinner) uiHideSpinner();
  } finally {
    state.isARProcessing = false;
  }
}

function _setupStatusListener() {
  state.modelViewer.addEventListener('ar-status', (event) => {
    const { status } = event.detail;
    const device = getDeviceType();

    if (status === 'session-started') {
      if (state.arPrompt) state.arPrompt.style.display = 'block';

      if (device === 'ios') {
        console.log("[ARManager] iOS AR Active. Offloading memory...");
        state.modelViewer.src = state.originalSrc;

        setTimeout(() => {
          _disposeTrackedResources();
        }, 1000);
      }
    }
    else if (status === 'object-placed') {
      if (state.arPrompt) state.arPrompt.style.display = 'none';
    }
    else if (status === 'not-presenting') {
      if (state.arPrompt) state.arPrompt.style.display = 'none';

      if (device === 'android') {
        state.modelViewer.src = state.originalSrc;
      }

      if (state.onExitCallback) state.onExitCallback();

      setTimeout(() => {
        fullCleanup();
        if (state.modelViewer.resetScene) state.modelViewer.resetScene();
      }, 500);
    }
  });
}

function injectIntoModelViewer(newObject) {
  try {
    const mv = state.modelViewer;
    const symbols = Object.getOwnPropertySymbols(mv);
    const sceneSymbol = symbols.find(s => s.description === 'scene');

    if (!sceneSymbol) return false;

    const internalScene = mv[sceneSymbol];
    let targetContainer = internalScene.children.find(c => c.name === 'model' || c.name === 'Pivot');

    if (!targetContainer) {
      targetContainer = internalScene;
    } else {
      targetContainer.traverse(node => {
        if (node.isMesh && node !== newObject) node.visible = false;
      });
    }

    state.injectedGroup = newObject;
    targetContainer.add(state.injectedGroup);
    return true;
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    return false;
  }
}

async function rebuildObject(sourceNode) {
  if (!sourceNode.visible) return null;

  let newNode;
  if (sourceNode.isMesh) {
    const oldGeom = sourceNode.geometry;
    const newGeom = track(oldGeom.clone());

    const oldMat = sourceNode.material;
    const newMat = track(new THREE.MeshStandardMaterial({
      name: (oldMat.name || "mat").replace(/[^a-zA-Z0-9]/g, "_"),
      color: oldMat.color.clone(),
      roughness: oldMat.roughness ?? 0.5,
      metalness: oldMat.metalness ?? 0.5,
      side: THREE.FrontSide,
      transparent: oldMat.transparent,
      opacity: oldMat.opacity
    }));

    const maps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'];
    for (const mapName of maps) {
      if (oldMat[mapName]) {
        newMat[mapName] = await _processTexture(oldMat[mapName]);
      }
    }

    newNode = new THREE.Mesh(newGeom, newMat);

    if (sourceNode.morphTargetInfluences) {
      newNode.morphTargetInfluences = [...sourceNode.morphTargetInfluences];
      fastBakeMorphs(newNode);
    }

    fastApplyPlanarUVs(newNode, oldMat);
    fixInvertedGeometryAndScale(newNode, sourceNode.scale);
  } else {
    newNode = new THREE.Group();
  }

  newNode.position.copy(sourceNode.position);
  newNode.quaternion.copy(sourceNode.quaternion);
  newNode.scale.copy(sourceNode.scale);

  for (const child of sourceNode.children) {
    const rebuiltChild = await rebuildObject(child);
    if (rebuiltChild) newNode.add(rebuiltChild);
  }
  return newNode;
}

async function _processTexture(originalTexture) {
  let tex;

  if (!state.texOpt.enabled || !originalTexture.image) {
    tex = track(originalTexture.clone());
  }
  else if (originalTexture.image.width <= state.texOpt.maxSize && originalTexture.image.height <= state.texOpt.maxSize) {
    tex = track(originalTexture.clone());
  }
  else {
    const img = originalTexture.image;
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;
    const max = state.texOpt.maxSize;

    if (width > height) {
      if (width > max) { height *= max / width; width = max; }
    } else {
      if (height > max) { width *= max / height; height = max; }
    }

    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);

    tex = await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const loader = new THREE.TextureLoader();
        const url = URL.createObjectURL(blob);
        loader.load(url, (t) => {
          URL.revokeObjectURL(url);
          resolve(track(t));
        });
      }, state.texOpt.format, state.texOpt.quality);
    });

    tex.name = originalTexture.name;
  }

  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;

  tex.repeat.set(1, 1);
  tex.offset.set(0, 0);
  tex.rotation = 0;
  tex.center.set(0, 0);

  tex.needsUpdate = true;
  return tex;
}

function _disposeTrackedResources() {
  console.log("[ARManager] Disposing resources...");
  state.generatedResources.materials.forEach(m => {
    ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach(k => {
      if (m[k] && m[k].dispose) m[k].dispose();
    });
    m.dispose();
  });
  state.generatedResources.geometries.forEach(g => g.dispose());
  state.generatedResources.textures.forEach(t => t.dispose());

  state.generatedResources.geometries = [];
  state.generatedResources.materials = [];
  state.generatedResources.textures = [];
}

function fullCleanup() {
  if (state.injectedGroup && state.injectedGroup.parent) {
    state.injectedGroup.parent.remove(state.injectedGroup);
  }
  state.injectedGroup = null;

  if (state.activeBlobUrl) {
    URL.revokeObjectURL(state.activeBlobUrl);
    state.activeBlobUrl = null;
  }
  _disposeTrackedResources();
}

function track(resource) {
  if (!resource) return resource;
  if (resource.isBufferGeometry) state.generatedResources.geometries.push(resource);
  else if (resource.isMaterial) state.generatedResources.materials.push(resource);
  else if (resource.isTexture) state.generatedResources.textures.push(resource);
  return resource;
}

async function generateGLBFromObject(obj) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(obj, (result) => {
      resolve(new Blob([result], { type: 'model/gltf-binary' }));
    }, (err) => reject(err), { binary: true });
  });
}

function getDeviceType() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

function waitForModelLoad() {
  return new Promise((resolve) => {
    if (state.modelViewer.loaded) resolve();
    else {
      const t = setTimeout(resolve, 4000);
      state.modelViewer.addEventListener('load', () => {
        clearTimeout(t);
        resolve();
      }, { once: true });
    }
  });
}

function _addAndroidSpecificLight(group) {
  const light = new THREE.AmbientLight(0xffffff, state.androidLightIntensity);
  group.add(light);
}

function fastBakeMorphs(mesh) {
  const geometry = mesh.geometry;
  if (!mesh.morphTargetInfluences || !geometry.morphAttributes.position) return;

  const influences = mesh.morphTargetInfluences;
  const morphPos = geometry.morphAttributes.position;
  const posAttr = geometry.attributes.position;

  for (let i = 0; i < posAttr.count; i++) {
    let x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
    for (let j = 0; j < influences.length; j++) {
      const inf = influences[j]; if (inf === 0) continue;
      x += morphPos[j].getX(i) * inf;
      y += morphPos[j].getY(i) * inf;
      z += morphPos[j].getZ(i) * inf;
    }
    posAttr.setXYZ(i, x, y, z);
  }
  posAttr.needsUpdate = true;
  geometry.morphAttributes = {};
  mesh.morphTargetInfluences = [];
}

function fastApplyPlanarUVs(object, sourceMaterial) {
  const matName = (object.material && object.material.name) ? object.material.name : "";

  const isX = matName.includes("_X");
  const isY = matName.includes("_Y");
  const isZ = matName.includes("_Z");

  if (!isX && !isY && !isZ) return;
  if (!object.geometry) return;

  const geometry = object.geometry;
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;

  let texMatrix = new THREE.Matrix3();

  const refMaterial = sourceMaterial || object.material;

  if (refMaterial && refMaterial.map) {
    refMaterial.map.updateMatrix();
    texMatrix = refMaterial.map.matrix;
  }

  const isAbsolutePlanar = matName.toLowerCase().includes("planar");

  geometry.computeBoundingBox();
  const min = geometry.boundingBox.min;
  const size = new THREE.Vector3().subVectors(geometry.boundingBox.max, min);
  size.x = size.x || 1; size.y = size.y || 1; size.z = size.z || 1;

  const uvVec = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    let uRaw = 0;
    let vRaw = 0;

    if (isAbsolutePlanar) {
      if (isZ) { uRaw = x; vRaw = z; }
      else if (isY) { uRaw = x; vRaw = y; }
      else if (isX) { uRaw = y; vRaw = -z; }
    } else {
      if (isZ) { uRaw = (x - min.x) / size.x; vRaw = (z - min.z) / size.z; }
      else if (isY) { uRaw = (x - min.x) / size.x; vRaw = (y - min.y) / size.y; }
      else if (isX) { uRaw = (y - min.y) / size.y; vRaw = (z - min.z) / size.z; }
    }

    uvVec.set(uRaw, vRaw, 1).applyMatrix3(texMatrix);

    let finalU = uvVec.x;
    let finalV = uvVec.y;

    if (isZ) { finalU += state.uvMatrix[4]; finalV += state.uvMatrix[5]; }
    else if (isY) { finalU += state.uvMatrix[2]; finalV += state.uvMatrix[3]; }
    else if (isX) { finalU += state.uvMatrix[0]; finalV += state.uvMatrix[1]; }

    uv.setXY(i, finalU, finalV);
  }

  uv.needsUpdate = true;
}


function fixInvertedGeometryAndScale(mesh, scale) {
  if (scale.x * scale.y * scale.z < 0) {
    const index = mesh.geometry.index;
    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        const t = index.getX(i + 1);
        index.setX(i + 1, index.getX(i + 2));
        index.setX(i + 2, t);
      }
      index.needsUpdate = true;
    }
  }
}

export function setUVMatrix2x3(m) { state.uvMatrix = m; }

export function setUVMaterialRepeatValue(n, x, y) {
  const f = state.materialsRepeat.find(m => m.name === n);
  f ? (f.x = x, f.y = y) : state.materialsRepeat.push({ name: n, x, y });
}

export function setUVMaterialOffsetValue(n, x, y) {
  const f = state.materialsOffset.find(m => m.name === n);
  f ? (f.x = x, f.y = y) : state.materialsOffset.push({ name: n, x, y });
}

export function setAndroidLightIntensity(v) { state.androidLightIntensity = v; }
