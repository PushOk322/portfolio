import * as THREE from 'three';

import { scene } from '../3d-scene.js';

const isNewThreeJs = parseInt(THREE.REVISION) >= 150;

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');
const textureCache = {};

function loadTextureAsync(texture) {
  return new Promise((resolve, reject) => {
    if (!texture.path || textureCache[texture.path]) {
      resolve();
      return;
    }
    textureLoader.load(
      texture.path,
      (loadedTexture) => {
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTexture.anisotropy = 16;
        loadedTexture.flipY = false;
        setTiling(loadedTexture, 1);
        textureCache[texture.path] = loadedTexture;
        resolve();
      },
      undefined,
      (error) => {
        console.error(`Error loading texture ${texture.path}:`, error);
        reject(error);
      }
    );
  });
}

function setTiling(texture, tiling) {
  texture.repeat.set(tiling, tiling);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
}

function setMaterialProperty(name, property, value) {
  let mat = null;
  scene.traverse((o) => {
    if (o.isMesh) {
      if (o.material.name == name) {
        mat = o.material;
        if (property === 'color' && typeof value === 'string') {
          mat[property] = new THREE.Color(value);
        } else if (Object.prototype.hasOwnProperty.call(mat, property)) {
          mat[property] = value;
        }
      }
    }
  });
}

function getMesh(name, model = scene) {
  var object = null;
  model?.traverse((o) => {
    if (o.isMesh) {
      if (name == o.name) {
        object = o;
      }
    }
  });

  return object;
}

function getGroup(name, model = scene) {
  var group = null;
  model.traverse((o) => {
    if (o.isGroup) {
      if (name == o.name) {
        group = o;
      }
    }
  });

  return group;
}

function getMeshDimensions(mesh) {
  const boundingBox = new THREE.Box3();
  boundingBox.setFromObject(mesh);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const width = size.x;
  const height = size.y;
  const depth = size.z;
  return { width: width, height: height, depth: depth };
}

function getMaterialsList(model = scene) {
  const materials = [];
  model.traverse((o) => {
    if (o.material) {
      materials.push(o.material.name);
    }
  });
  return materials;
}

function getMeshNamesList(model = scene) {
  const names = [];
  model.traverse((o) => {
    if (o.name) {
      names.push(o.name);
    }
  });
  return names;
}

function getMaterialFromScene(name) {
  var material = null;
  scene.traverse((o) => {
    if (o.material) {
      if (name == o.material.name) {
        material = o.material;
      }
    }
  });

  return material;
}

function changeMaterialTilling(materialName, x, y) {
  const materialObject = getMaterialFromScene(materialName);

  if (materialObject == null) { return; }

  if (materialObject.map != null) {
    materialObject.map.repeat.set(x, y);
  }

  if (materialObject.normalMap != null) {
    materialObject.normalMap.repeat.set(x, y);
  }

  if (materialObject.roughnessMap != null) {
    materialObject.roughnessMap.repeat.set(x, y);
  }

  if (materialObject.metalnessMap != null) {
    materialObject.metalnessMap.repeat.set(x, y);
  }

  if (materialObject.aoMap != null) {
    materialObject.aoMap.repeat.set(x, y);
  }
}

function changeMaterialOffset(materialName, x, y) {
  const materialObject = getMaterialFromScene(materialName);

  if (materialObject == null) { return; }

  if (materialObject.map != null) {
    materialObject.map.offset.set(x, y);
  }

  if (materialObject.normalMap != null) {
    materialObject.normalMap.offset.set(x, y);
  }

  if (materialObject.roughnessMap != null) {
    materialObject.roughnessMap.offset.set(x, y);
  }

  if (materialObject.metalnessMap != null) {
    materialObject.metalnessMap.offset.set(x, y);
  }

  if (materialObject.aoMap != null) {
    materialObject.aoMap.offset.set(x, y);
  }
}

function setMaterialTexture(model, materialNames, textureValue, tilingValue = 1) {
  model?.traverse((o) => {
    if (o.material) {
      for (let i = 0; i < materialNames.length; i++) {
        if (o.material.name === materialNames[i]) {
          applyTexture(o.material, textureValue, tilingValue);
        }
      }
    }
  });

  function applyTexture(material, textureValue, tilingValue) {
    const textureProperties = {
      Map: {
        apply: (material, texture) => {
          if (texture) {
            if (isNewThreeJs) {
              texture.colorSpace = THREE.SRGBColorSpace; 
            } else {
              texture.encoding = THREE.sRGBEncoding;
            }
            material.map = texture;
            material.map.needsUpdate = true;
          } else if (texture === null) {
            material.map = null;
            material.needsUpdate = true;
          }
        },
      },
      Normal: {
        apply: (material, texture) => {
          if (texture) {
            if (isNewThreeJs) {
              texture.colorSpace = THREE.NoColorSpace;
            }
            material.normalMap = texture;
            material.normalMap.needsUpdate = true;
          } else if (texture === null) {
            material.normalMap = null;
            material.needsUpdate = true;
          }
        },
      },
      Roughness: {
        apply: (material, texture) => {
          if (texture) {
            if (isNewThreeJs) {
              texture.colorSpace = THREE.NoColorSpace;
            }
            material.roughnessMap = texture;
            material.roughnessMap.needsUpdate = true;
          } else if (texture === null) {
            material.roughnessMap = null;
            material.needsUpdate = true;
          }
        },
      },
      Metalness: {
        apply: (material, texture) => {
          if (texture) {
            if (isNewThreeJs) {
              texture.colorSpace = THREE.NoColorSpace;
            }
            material.metalnessMap = texture;
            material.metalnessMap.needsUpdate = true;
          } else if (texture === null) {
            material.metalnessMap = null;
            material.needsUpdate = true;
          }
        },
      },
      Emission: {
        apply: (material, texture) => {
          if (texture) {
            if (isNewThreeJs) {
              texture.colorSpace = THREE.SRGBColorSpace;
            } else {
              texture.encoding = THREE.sRGBEncoding; 
            }
            material.emissiveMap = texture;
            material.emissiveMap.needsUpdate = true;
          } else if (texture === null) {
            material.emissiveMap = null;
            material.needsUpdate = true;
          }
        },
      },
      AO: {
        apply: (material, texture) => {
          if (texture) {
            if (isNewThreeJs) {
              texture.colorSpace = THREE.NoColorSpace;
            }
            material.aoMap = texture;
            material.aoMap.needsUpdate = true;
          } else if (texture === null) {
            material.aoMap = null;
            material.needsUpdate = true;
          }
        },
      },
      Gloss: {
        apply: (material) => {
          material.metalness = 1;
          material.roughness = 0.2;
          material.needsUpdate = true;
        },
      },
    };

    for (const node in textureProperties) {
      const key = node.toLowerCase();
      const value = textureValue[key];

      if (value === undefined) {
        continue;
      }

      if (value === null) {
        textureProperties[node].apply(material, null);
        continue;
      }

      if (!textureCache[value]) {
        textureLoader.load(
          value,
          (texture) => {
            // texture.magFilter = THREE.NearestFilter;
            // texture.minFilter = THREE.NearestMipmapNearestFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.anisotropy = 16;
            texture.flipY = false;
            setTiling(texture, tilingValue);
            textureCache[value] = texture;
            textureProperties[node].apply(material, texture);
            material.needsUpdate = true;
          },
          undefined,
          () => {
            console.error(`Error loading texture ${value}`);
          }
        );
      } else {
        textureProperties[node].apply(material, textureCache[value]);
        material.needsUpdate = true;
      }
    }
  }
}

function setMaterialColor(materialName, color) {
  const materialObject = getMaterialFromScene(materialName);
  if (materialObject == null) { return; }
  materialObject.color.set(color);
  materialObject.needsUpdate = true;
}

function isEqualVector(vector1, vector2, precision = 4) {
  return (
    vector1.x.toFixed(precision) === vector2.x.toFixed(precision) &&
    vector1.y.toFixed(precision) === vector2.y.toFixed(precision) &&
    vector1.z.toFixed(precision) === vector2.z.toFixed(precision)
  );
}

function toggleRoughnessMap(model, materialName, enable) {
  model.traverse((object) => {
    if (object.isMesh && object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => {
          if (material.name === materialName && (material.roughnessMap || material.roughnessMapOriginal)) {
            if (enable && material.roughnessMapOriginal) {
              material.roughnessMap = material.roughnessMapOriginal;
            } else if (!enable && material.roughnessMap) {
              material.roughnessMapOriginal = material.roughnessMap;
              material.roughnessMap = null;
            }
            material.needsUpdate = true;
          }
        });
      } else {
        if (object.material.name === materialName && (object.material.roughnessMap || object.material.roughnessMapOriginal)) {
          if (enable && object.material.roughnessMapOriginal) {
            object.material.roughnessMap = object.material.roughnessMapOriginal;
          } else if (!enable && object.material.roughnessMap) {
            object.material.roughnessMapOriginal = object.material.roughnessMap;
            object.material.roughnessMap = null;
          }
          object.material.needsUpdate = true;
        }
      }
    }
  });
}

function setVisibility(model, value, meshArray = []) {
  if (model) {
    if (value == undefined && value == null) {
      return;
    }

    if (meshArray.length === 0) {
      model.visible = value;
      return;
    }

    for (let i = 0; i < meshArray.length; i++) {
      model.traverse((o) => {
        if (o.name == meshArray[i]) {
          o.visible = value;
        }
      });
    }
  }
}

function cloneMaterial(material) {
  const clonedMaterial = material.clone();
  clonedMaterial.emissive = material.emissive ? material.emissive.clone() : new THREE.Color(0x000000);
  return clonedMaterial;
}

function cloneMaterialWithTextures(object) {
  object.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material = child.material.clone();

      const textures = [
        'map',
        'normalMap',
        'roughnessMap',
        'metalnessMap',
        'aoMap',
      ];

      textures.forEach((textureType) => {
        if (child.material[textureType]) {
          child.material[textureType] = child.material[textureType].clone();
          child.material[textureType].needsUpdate = true;
        }
      });

      child.material.needsUpdate = true;
    }
  });
}

//* ###################################################################### /
//! function exportVisibleObjectsAsGLB
//* Exports the visible objects of a scene to a GLB file.

/**
 * The function creates a temporary copy of the scene, removes all invisible objects
 * (where object.visible === false), and then initiates the download.
 *
 * @param {THREE.Scene} sceneOrModelToExport - The Three.js scene to export.
 * @param {string} [filename='model.glb'] - Filename for the download.
 * @returns {Promise<void>} Promise that resolves after the download starts.
 */

async function exportVisibleObjectsAsGLB(sceneOrModelToExport, filename = 'model.glb') {
  if (typeof THREE.GLTFExporter === 'undefined') {
    console.error('THREE.GLTFExporter is not available');
    return Promise.reject('Exporter not found.');
  }

  function saveArrayBuffer(buffer, filename) {
    const blob = new Blob([buffer], { type: 'model/gltf-binary' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  const clonedScene = sceneOrModelToExport.clone(true);
  const objectsToRemove = [];

  clonedScene.traverse((object) => {
    if (!object.visible) {
      objectsToRemove.push(object);
    }
  });

  objectsToRemove.forEach((object) => {
    if (object.parent) {
      object.parent.remove(object);
    }
  });

  const exporter = new THREE.GLTFExporter();

  const options = {
    binary: true,
  };

  return new Promise((resolve, reject) => {
    exporter.parse(
      clonedScene,
      (result) => {
        saveArrayBuffer(result, filename);
        resolve();
      },
      (error) => {
        console.error('GLB export error:', error);
        reject(error);
      },
      options
    );
  });
}

function changeMaterialTilingByObjectAndAxis(
  object,
  materialName,
  axis = "x",
  value = 1,
) {
  object.traverse((child) => {
    if (
      child.isMesh &&
      child.material &&
      child.material.name?.includes(materialName)
    ) {
      const textures = [
        child.material.map,
        child.material.normalMap,
        child.material.roughnessMap,
        child.material.metalnessMap,
        child.material.aoMap,
      ].filter(Boolean);

      textures.forEach((texture) => {
        if (axis === "x") {
          texture.repeat.x = value;
        } else if (axis === "y") {
          texture.repeat.y = value;
        }
        if (texture.image) {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.needsUpdate = true;
        }
      });

      child.material.needsUpdate = true;
    }
  });
}

function changeMaterialOffsetByObject(
  object,
  materialName,
  x, y,
  setToCenter = false
) {
  object.traverse((child) => {
    if (
      child.material &&
      child.material.name?.includes(materialName)
    ) {
      const textures = [
        child.material.map,
        child.material.normalMap,
        child.material.roughnessMap,
        child.material.metalnessMap,
        child.material.aoMap,
      ].filter(Boolean);

      textures.forEach((texture) => {
          texture.offset.set(x, y);
        if (setToCenter) {
          texture.center.set(0.5, 0.5);
        }
        if (texture.image) {
          texture.needsUpdate = true;
        }
      });

      child.material.needsUpdate = true;
    }
  });
}

function disposeTexture(texture) {
  if (texture) {
    texture.dispose();
  }
}

function getCurrentTilingValue(object, axis, materialName) {
  let tilingValue = 1;

  object.traverse((child) => {
    if (
      child.isMesh &&
      child.material &&
      child.material.name?.includes(materialName)
    ) {
      const textures = [
        child.material.map,
        child.material.normalMap,
        child.material.roughnessMap,
        child.material.metalnessMap,
        child.material.aoMap,
      ].filter(Boolean);

      textures.forEach((texture) => {
        if (axis === 'x') {
          tilingValue = texture.repeat.x;
        } else if (axis === 'y') {
          tilingValue = texture.repeat.y;
        }
      });
    }
  });

  return tilingValue;
}

//* ###################################################################### /
/* --------------------------------- */

export {
  loadTextureAsync,
  setMaterialProperty,
  getMesh,
  getGroup,
  getMeshDimensions,
  getMaterialsList,
  getMeshNamesList,
  getMaterialFromScene,
  changeMaterialTilling,
  changeMaterialOffset,
  setMaterialTexture,
  setMaterialColor,
  cloneMaterial,
  cloneMaterialWithTextures,
  isEqualVector,
  toggleRoughnessMap,
  setVisibility,
  exportVisibleObjectsAsGLB,
  changeMaterialTilingByObjectAndAxis,
  changeMaterialOffsetByObject,
  disposeTexture,
  getCurrentTilingValue,
};
