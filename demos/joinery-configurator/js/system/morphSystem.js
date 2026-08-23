import * as THREE from 'three';
import { computeMorphedAttributes } from 'three/addons/utils/BufferGeometryUtils.js'
import { requestDelayedRender } from '../3d-scene.js';
// Re-exported below so existing callers keep importing it from here, while the
// integration layer can reach it without importing a renderer.
import { interpolateValue } from '../math-utils.js';

let isWorldposVertexShaderEnabled = true;
let morphs = [];
let globalMorphs = [];

let planarTextureScale = 1;

function setPlanarTextureScale(value) {
  planarTextureScale = value;
}


function Shader_ChangeVertexToWorldposOld(object) {
  const isNewThreeJs = parseInt(THREE.REVISION) >= 150;
  const vUvMap = isNewThreeJs ? 'vMapUv' : 'vUv';
  const vUvNormal = isNewThreeJs ? 'vNormalMapUv' : 'vUv';
  const uvTransform = isNewThreeJs ? 'mapTransform' : 'uvTransform';

  promiseDelayShaderSettings(500, object, () => {
    if (!object.isMesh || !object.material) return;

    if (isWorldposVertexShaderEnabled) {
      const matName = object.material.name;

      let uvLogic = '';
      if (matName.includes("_Z")) {
        uvLogic = `vec2 planarUV = worldPosition.xz;`;
      } else if (matName.includes("_Y")) {
        uvLogic = `vec2 planarUV = worldPosition.xy;`;
      } else if (matName.includes("_X")) {
        uvLogic = `
          mat2 rotation = mat2(0.0, 1.0, -1.0, 0.0);
          vec2 planarUV = rotation * vec2(worldPosition.y, worldPosition.z);
        `;
      }

      if (uvLogic !== '') {
        object.material.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '');

          shader.vertexShader = shader.vertexShader.replace(
            '#include <worldpos_vertex>',
            `
            #include <worldpos_vertex>
            
            ${uvLogic}

            #ifdef USE_MAP
              ${vUvMap} = (${uvTransform} * vec3(planarUV, 1.0)).xy;
            #endif

            #ifdef USE_NORMALMAP
              ${vUvNormal} = (${uvTransform} * vec3(planarUV, 1.0)).xy;
            #endif

            #ifdef USE_ROUGHNESSMAP
              vRoughnessMapUv = (${uvTransform} * vec3(planarUV, 1.0)).xy;
            #endif

            #ifdef USE_METALNESSMAP
              vMetalnessMapUv = (${uvTransform} * vec3(planarUV, 1.0)).xy;
            #endif

            #ifdef USE_EMISSIVEMAP
              vEmissiveMapUv = (${uvTransform} * vec3(planarUV, 1.0)).xy;
            #endif

            #ifdef USE_ALPHAMAP
              vAlphaMapUv = (${uvTransform} * vec3(planarUV, 1.0)).xy;
            #endif
            `
          );
        };
        object.material.needsUpdate = true;
      }
    }
  });
}

function computePlanarCoeffs(geometry) {
  const positions = geometry.attributes.position;
  const uvs = geometry.attributes.uv;
  const normals = geometry.attributes.normal;

  // Default fallback: identity mapping (scale=1, offset=0), no swap
  const defaultResult = { coeffs: new THREE.Vector4(1, 1, 0, 0), swap: 0.0 };

  if (!positions || !uvs || !normals) {
    return { Y: { ...defaultResult }, Z: { ...defaultResult }, X: { ...defaultResult } };
  }

  // Per-direction accumulators for position and UV bounds + correlation data
  // Y-dominant: project onto XZ → posA=x, posB=z
  // Z-dominant: project onto XY → posA=x, posB=y
  // X-dominant: project onto ZY → posA=z, posB=y
  const dirs = {};
  for (const key of ['Y', 'Z', 'X']) {
    dirs[key] = {
      posAMin: Infinity, posAMax: -Infinity,
      posBMin: Infinity, posBMax: -Infinity,
      uvUMin: Infinity, uvUMax: -Infinity,
      uvVMin: Infinity, uvVMax: -Infinity,
      // Accumulators for covariance computation (single-pass)
      sumU: 0, sumV: 0, sumPosA: 0, sumPosB: 0,
      sumU_PosA: 0, sumU_PosB: 0,
      sumV_PosA: 0, sumV_PosB: 0,
      count: 0
    };
  }

  for (let i = 0; i < positions.count; i++) {
    const nx = Math.abs(normals.getX(i));
    const ny = Math.abs(normals.getY(i));
    const nz = Math.abs(normals.getZ(i));
    const px = positions.getX(i);
    const py = positions.getY(i);
    const pz = positions.getZ(i);
    const u = uvs.getX(i);
    const v = uvs.getY(i);

    let dir, posA, posB;

    if (ny >= nx && ny >= nz) {
      dir = dirs.Y; posA = px; posB = pz;
    } else if (nz >= nx && nz >= ny) {
      dir = dirs.Z; posA = px; posB = py;
    } else {
      dir = dirs.X; posA = pz; posB = py;
    }

    if (posA < dir.posAMin) dir.posAMin = posA;
    if (posA > dir.posAMax) dir.posAMax = posA;
    if (posB < dir.posBMin) dir.posBMin = posB;
    if (posB > dir.posBMax) dir.posBMax = posB;
    if (u < dir.uvUMin) dir.uvUMin = u;
    if (u > dir.uvUMax) dir.uvUMax = u;
    if (v < dir.uvVMin) dir.uvVMin = v;
    if (v > dir.uvVMax) dir.uvVMax = v;

    // Accumulate for covariance: cov(U, posA) vs cov(U, posB) and same for V
    dir.sumU += u;
    dir.sumV += v;
    dir.sumPosA += posA;
    dir.sumPosB += posB;
    dir.sumU_PosA += u * posA;
    dir.sumU_PosB += u * posB;
    dir.sumV_PosA += v * posA;
    dir.sumV_PosB += v * posB;

    dir.count++;
  }

  function makeCoeffs(dir) {
    if (dir.count === 0) return { ...defaultResult };

    const n = dir.count;

    // Determine axis mapping: does U correlate with posA or posB?
    // cov(U, posA) = E[U*posA] - E[U]*E[posA]
    const meanU = dir.sumU / n;
    const meanV = dir.sumV / n;
    const meanPosA = dir.sumPosA / n;
    const meanPosB = dir.sumPosB / n;
    const covU_PosA = (dir.sumU_PosA / n) - meanU * meanPosA;
    const covU_PosB = (dir.sumU_PosB / n) - meanU * meanPosB;
    const covV_PosA = (dir.sumV_PosA / n) - meanV * meanPosA;
    const covV_PosB = (dir.sumV_PosB / n) - meanV * meanPosB;

    // If |cov(U, posB)| > |cov(U, posA)| → U maps to posB, V maps to posA → swap
    const swapped = Math.abs(covU_PosB) > Math.abs(covU_PosA);

    // Extract the original signs for U and V mappings
    const signU = Math.sign(swapped ? covU_PosB : covU_PosA) || 1;
    const signV = Math.sign(swapped ? covV_PosA : covV_PosB) || 1;

    // Use the correct position ranges for each UV axis
    const posRangeForU = swapped ? ((dir.posBMax - dir.posBMin) || 0.0001) : ((dir.posAMax - dir.posAMin) || 0.0001);
    const posRangeForV = swapped ? ((dir.posAMax - dir.posAMin) || 0.0001) : ((dir.posBMax - dir.posBMin) || 0.0001);
    const uvRangeU = (dir.uvUMax - dir.uvUMin);
    const uvRangeV = (dir.uvVMax - dir.uvVMin);

    // Compute per-axis scales and restore their original signs
    const rawScaleU = ((uvRangeU > 0.0001) ? (uvRangeU / posRangeForU) : 1) * signU;
    const rawScaleV = ((uvRangeV > 0.0001) ? (uvRangeV / posRangeForV) : 1) * signV;

    // Use separate scales per axis (as derived from the model) and apply the global manual multiplier
    const finalScaleU = rawScaleU * planarTextureScale;
    const finalScaleV = rawScaleV * planarTextureScale;

    // Center the mapping: mesh centroid maps to UV centroid
    const posCenterForU = swapped ? ((dir.posBMin + dir.posBMax) / 2) : ((dir.posAMin + dir.posAMax) / 2);
    const posCenterForV = swapped ? ((dir.posAMin + dir.posAMax) / 2) : ((dir.posBMin + dir.posBMax) / 2);
    const uvCenterU = (uvRangeU > 0.0001) ? ((dir.uvUMin + dir.uvUMax) / 2) : 0.5;
    const uvCenterV = (uvRangeV > 0.0001) ? ((dir.uvVMin + dir.uvVMax) / 2) : 0.5;

    const offsetU = uvCenterU - finalScaleU * posCenterForU;
    const offsetV = uvCenterV - finalScaleV * posCenterForV;

    return {
      coeffs: new THREE.Vector4(finalScaleU, finalScaleV, offsetU, offsetV),
      swap: swapped ? 1.0 : 0.0
    };
  }

  return {
    Y: makeCoeffs(dirs.Y),
    Z: makeCoeffs(dirs.Z),
    X: makeCoeffs(dirs.X)
  };
}

function Shader_ChangeVertexToWorldpos(object) {
  promiseDelayShaderSettings(500, object, () => {
    if (!object.isMesh || !object.material) return;

    const materials = Array.isArray(object.material) ? object.material : [object.material];

    materials.forEach((material, index) => {
      // Only apply planar mapping if the material name includes "_planar"
      const isPlanarMaterial = material.name && material.name.toLowerCase().includes('_planar');

      if (isWorldposVertexShaderEnabled && isPlanarMaterial) {
        // Compute per-direction linear mapping coefficients: position → UV
        const coeffs = computePlanarCoeffs(object.geometry);

        // Clone the material to prevent shared materials from overriding each other's custom shaders/uniforms
        const clonedMaterial = material.clone();
        if (Array.isArray(object.material)) {
          object.material[index] = clonedMaterial;
        } else {
          object.material = clonedMaterial;
        }

        clonedMaterial.onBeforeCompile = (shader) => {
          // Per-direction coefficients: vec4(scaleU, scaleV, offsetU, offsetV)
          shader.uniforms.planarCoeffsY = { value: coeffs.Y.coeffs };
          shader.uniforms.planarCoeffsZ = { value: coeffs.Z.coeffs };
          shader.uniforms.planarCoeffsX = { value: coeffs.X.coeffs };
          // Per-direction axis swap flags (0.0 = no swap, 1.0 = swap)
          shader.uniforms.planarSwapY = { value: coeffs.Y.swap };
          shader.uniforms.planarSwapZ = { value: coeffs.Z.swap };
          shader.uniforms.planarSwapX = { value: coeffs.X.swap };

          // Declare uniforms at the top of the vertex shader
          shader.vertexShader =
            'uniform vec4 planarCoeffsY;\n' +
            'uniform vec4 planarCoeffsZ;\n' +
            'uniform vec4 planarCoeffsX;\n' +
            'uniform float planarSwapY;\n' +
            'uniform float planarSwapZ;\n' +
            'uniform float planarSwapX;\n' +
            shader.vertexShader;

          shader.vertexShader = shader.vertexShader.replace(
            '#include <project_vertex>',
            `
            #include <project_vertex>
            
            vec3 absN = abs(objectNormal);
            vec2 planarUV;
            
            if (absN.y >= absN.x && absN.y >= absN.z) {
                // Y-dominant: project onto XZ (or ZX if swapped)
                vec2 posYAB = planarSwapY > 0.5
                    ? vec2(transformed.z, transformed.x)
                    : vec2(transformed.x, transformed.z);
                planarUV = vec2(planarCoeffsY.x * posYAB.x + planarCoeffsY.z,
                                planarCoeffsY.y * posYAB.y + planarCoeffsY.w);
            } else if (absN.z >= absN.x && absN.z >= absN.y) {
                // Z-dominant: project onto XY (or YX if swapped)
                vec2 posZAB = planarSwapZ > 0.5
                    ? vec2(transformed.y, transformed.x)
                    : vec2(transformed.x, transformed.y);
                planarUV = vec2(planarCoeffsZ.x * posZAB.x + planarCoeffsZ.z,
                                planarCoeffsZ.y * posZAB.y + planarCoeffsZ.w);
            } else {
                // X-dominant: project onto ZY (or YZ if swapped)
                vec2 posXAB = planarSwapX > 0.5
                    ? vec2(transformed.y, transformed.z)
                    : vec2(transformed.z, transformed.y);
                planarUV = vec2(planarCoeffsX.x * posXAB.x + planarCoeffsX.z,
                                planarCoeffsX.y * posXAB.y + planarCoeffsX.w);
            }
            #if defined( USE_UV ) || defined( USE_ANISOTROPY )
              vUv = vec3( planarUV, 1.0 ).xy;
            #endif

            #ifdef USE_MAP
              vMapUv = ( mapTransform * vec3( planarUV, 1.0 ) ).xy;
            #endif

            #ifdef USE_NORMALMAP
              vNormalMapUv = ( normalMapTransform * vec3( planarUV, 1.0 ) ).xy;
            #endif

            #ifdef USE_ROUGHNESSMAP
              vRoughnessMapUv = ( roughnessMapTransform * vec3( planarUV, 1.0 ) ).xy;
            #endif

            #ifdef USE_METALNESSMAP
              vMetalnessMapUv = ( metalnessMapTransform * vec3( planarUV, 1.0 ) ).xy;
            #endif

            #ifdef USE_EMISSIVEMAP
              vEmissiveMapUv = ( emissiveMapTransform * vec3( planarUV, 1.0 ) ).xy;
            #endif

            #ifdef USE_ALPHAMAP
              vAlphaMapUv = ( alphaMapTransform * vec3( planarUV, 1.0 ) ).xy;
            #endif

            #ifdef USE_AOMAP
              vAoMapUv = ( aoMapTransform * vec3( planarUV, 1.0 ) ).xy;
            #endif

            #ifdef USE_LIGHTMAP
              vLightMapUv = ( lightMapTransform * vec3( planarUV, 1.0 ) ).xy;
            #endif
            `
          );
        };
        clonedMaterial.needsUpdate = true;
      }
    });
  });
}

function promiseDelayShaderSettings(time, object, callback) {
  if (time == null) {
    time = 2000;
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('resolved');
      if (object.material.map == null) {
        promiseDelayShaderSettings(time, object, callback);
      } else {
        if (callback != null) {
          callback();
        }
      }
    }, time);
  });
}

function initMorphModel(model) {
  parseMorphByModel(model);
}

function parseMorphByModel(model, callback = null) {
  morphs = [];
  model.traverse((object) => {
    if (object.isMesh) {
      Shader_ChangeVertexToWorldpos(object);

      if (object.morphTargetDictionary != null) {

        for (const [key, value] of Object.entries(object.morphTargetDictionary)) {

          var morph = {
            name: key,
            object: object,
            key: value,
            value: value
          };

          if (!morphs.includes(morph)) {
            morphs.push(morph);
          }
        }
      }
    }
  });

  PrepareGlobalMorphs(callback);
}

function PrepareGlobalMorphs(callback = null) {
  globalMorphs = [];

  for (let index = 0; index < morphs.length; index++) {
    const morph = morphs[index];

    var hasMorph = false;

    for (let m = 0; m < globalMorphs.length; m++) {
      const globalMorph = globalMorphs[m];
      if (globalMorph.name != morph.name) { continue; }
      hasMorph = true;
      break;
    }

    if (!hasMorph) {
      globalMorphs.push(morph);
    }
  }

  if (callback != null) {
    callback();
  }
}

function computeAllMorphedAttributes(scene) {
  for (let index = 0; index < morphs.length; index++) {
    const morph = morphs[index];
    var computeMorphedAttributesValue = computeMorphedAttributes(morph.object);
    morph.object.geometry.computeMorphedAttributes = computeMorphedAttributesValue;
  }

  if (!scene) { return; }

  scene.traverse((object) => {
    if (object.isMesh) {
      var computeMorphedAttributesValue = computeMorphedAttributes(object);
      object.geometry.computeMorphedAttributes = computeMorphedAttributesValue;
    }
  });
}

function changeObjectMorph(object, key, inputValue) {
  if (!object) return;

  function processObject(obj) {
    if (obj.isMesh && obj.morphTargetDictionary) {
      const morphIndex = obj.morphTargetDictionary[key];
      if (morphIndex !== undefined && obj.morphTargetInfluences) {
        obj.morphTargetInfluences[morphIndex] = inputValue;
      }
    }

    if (obj.children && obj.children.length > 0) {
      obj.children.forEach(child => processObject(child));
    }
  }

  processObject(object);
}

function changeGlobalMorph(morphName, inputvalue) {
  for (let index = 0; index < morphs.length; index++) {
    const morph = morphs[index];

    if (morph.name != morphName) { continue; }
    if (morph.object == null) { continue; }
    if (!morph.object.isMesh) { continue; }
    if (morph.object.morphTargetInfluences == null) { continue; }

    morph.object.morphTargetInfluences[morph.key] = inputvalue;
  }

  requestDelayedRender();
}

function animateGlobalMorph(morphName, valueStart, valueEnd, callback = () => { }, timeInterval = 200, steps = 5) {
  const stepDuration = timeInterval / steps;
  const stepValue = (valueEnd - valueStart) / steps;
  let currentValue = valueStart;
  let completedSteps = 0;

  for (let i = 1; i <= steps; i++) {
    setTimeout(() => {
      changeGlobalMorph(morphName, currentValue);
      currentValue += stepValue;
      completedSteps++;
      if (completedSteps === steps) {
        changeGlobalMorph(morphName, valueEnd);
        callback();
      }
    }, i * stepDuration);
  }
}

function cloneGeometryWithMorphTargets(object) {
  object.traverse((child) => {
    if (child.isMesh && child.geometry) {
      child.geometry = child.geometry.clone();

      if (child.geometry.morphAttributes) {
        child.geometry.morphAttributes = { ...child.geometry.morphAttributes };
      }

      child.morphTargetInfluences = child.morphTargetInfluences
        ? [...child.morphTargetInfluences]
        : [];
      child.morphTargetDictionary = child.morphTargetDictionary
        ? { ...child.morphTargetDictionary }
        : {};
    }
  });
}

function fixMorphTargetsForScene(scene) {
  scene.traverse((object) => {
    if (object.isMesh && object.morphTargetInfluences && object.geometry.morphAttributes.position) {
      const geometry = object.geometry.clone();
      const positionAttribute = geometry.attributes.position;

      for (let i = 0; i < positionAttribute.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(positionAttribute, i);

        for (let j = 0; j < object.morphTargetInfluences.length; j++) {
          const influence = object.morphTargetInfluences[j] || 0;
          if (influence && geometry.morphAttributes.position[j]) {
            const morphVector = new THREE.Vector3();
            morphVector.fromBufferAttribute(geometry.morphAttributes.position[j], i);
            vertex.addScaledVector(morphVector, influence);
          }
        }

        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }

      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();

      geometry.morphAttributes = {};
      object.morphTargetInfluences = [];
      object.morphTargetDictionary = {};

      object.geometry = geometry;
    }
  });
}

function changeShapekeyNameForObject(object, keyName, newKeyName) {
  if (!object) return;

  function processObject(obj) {
    if (obj.isMesh && obj.morphTargetDictionary) {
      if (keyName in obj.morphTargetDictionary) {
        const morphIndex = obj.morphTargetDictionary[keyName];
        obj.morphTargetDictionary[newKeyName] = morphIndex;
        delete obj.morphTargetDictionary[keyName];
      }
    }

    if (obj.children && obj.children.length > 0) {
      obj.children.forEach(child => processObject(child));
    }
  }

  processObject(object);
}

/* --------------------------------- */

export {
  initMorphModel,
  computeAllMorphedAttributes,
  changeObjectMorph,
  changeGlobalMorph,
  animateGlobalMorph,
  interpolateValue,
  cloneGeometryWithMorphTargets,
  fixMorphTargetsForScene,
  changeShapekeyNameForObject,
};
