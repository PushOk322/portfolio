import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DOOR_DESIGN_IDS, DESIGN_NODE_ALIASES, DESIGN_MATERIAL_FIXES,
  COLOR_SOURCE_BY_MATERIAL, designSupportsGlass, designSupportsWindowFrame,
} from '../js/door-designs.js';
import { readGlb } from './glb.mjs';

const MODEL = path.join(
  path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'models', 'door_demo.glb',
);

const { json: gltf, bin } = readGlb(MODEL);

// Only VEC2 float accessors — enough for the UV checks below.
function readVec2(accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  assert.equal(accessor.type, 'VEC2');
  assert.equal(accessor.componentType, 5126, 'expected float UVs');

  const view = gltf.bufferViews[accessor.bufferView];
  const start = bin.byteOffset + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return new Float32Array(bin.buffer, start, accessor.count * 2);
}
const nodeNames = new Set(gltf.nodes.map(n => n.name));
const materialNames = new Set(gltf.materials.map(m => m.name));
const MATERIALS = ['alum', 'pvc'];

// A design part is present if the GLB has it under the name the controller
// builds, or under a name we know is misspelled there.
const has = name => nodeNames.has(name) || nodeNames.has(DESIGN_NODE_ALIASES[name]);

test('every catalogued design has a base panel in both materials', () => {
  for (const id of DOOR_DESIGN_IDS) {
    for (const material of MATERIALS) {
      const name = `${material}_door_design_${id}`;
      assert.ok(nodeNames.has(name), `missing ${name}`);
    }
  }
});

test('the glass flag matches what the model ships', () => {
  for (const id of DOOR_DESIGN_IDS) {
    for (const material of MATERIALS) {
      for (const glass of ['clear', 'blur']) {
        const name = `${material}_door_design_${id}_glass_${glass}`;
        assert.equal(has(name), designSupportsGlass(id), `${name} vs catalogue`);
      }
    }
  }
});

test('the window frame flag matches what the model ships', () => {
  for (const id of DOOR_DESIGN_IDS) {
    for (const material of MATERIALS) {
      const name = `${material}_door_design_${id}_wind_frame`;
      assert.equal(nodeNames.has(name), designSupportsWindowFrame(id), `${name} vs catalogue`);
    }
  }
});

test('no design in the model is missing from the catalogue', () => {
  const inModel = new Set();
  for (const name of nodeNames) {
    const match = /^(?:alum|pvc)_door_design_([^_]+(?:_[^_]+)*?)(?:_glass_\w+|_glass|_wind_frame)?$/
      .exec(name);
    if (match) inModel.add(match[1]);
  }

  assert.deepEqual(
    [...inModel].sort(), [...DOOR_DESIGN_IDS].sort(),
    'catalogue and model disagree on which designs exist',
  );
});

test('every aliased name is a real node, and the correct name is not', () => {
  for (const [correct, alias] of Object.entries(DESIGN_NODE_ALIASES)) {
    assert.ok(nodeNames.has(alias), `alias ${alias} is not in the model`);
    assert.ok(
      !nodeNames.has(correct),
      `${correct} now exists — drop the alias for it from DESIGN_NODE_ALIASES`,
    );
  }
});

// Reading the glass material a node actually uses, so the two checks below
// speak in terms of what renders rather than what the name promises.
function materialsOf(nodeName) {
  const node = gltf.nodes.find(n => n.name === nodeName);
  if (!node || node.mesh === undefined) return [];
  return [...new Set(
    gltf.meshes[node.mesh].primitives
      .map(p => gltf.materials[p.material]?.name)
      .filter(Boolean),
  )];
}

test('every glass node still needing a material fix is listed', () => {
  for (const name of nodeNames) {
    const wanted = /_glass_blur$/.test(name) ? 'glass_blur'
      : /_glass_clear$/.test(name) ? 'glass_clear'
        : null;
    if (!wanted) continue;

    if (materialsOf(name).includes(wanted)) continue;
    assert.equal(
      DESIGN_MATERIAL_FIXES[name], wanted,
      `${name} does not use ${wanted} and has no entry in DESIGN_MATERIAL_FIXES`,
    );
  }
});

test('every material fix is still needed and still resolvable', () => {
  for (const [nodeName, materialName] of Object.entries(DESIGN_MATERIAL_FIXES)) {
    assert.ok(nodeNames.has(nodeName), `${nodeName} is not in the model`);
    assert.ok(materialNames.has(materialName), `${materialName} is not a material`);
    assert.ok(
      !materialsOf(nodeName).includes(materialName),
      `${nodeName} now uses ${materialName} — drop it from DESIGN_MATERIAL_FIXES`,
    );
  }
});

test('every tintable material in the map exists in the model', () => {
  for (const name of Object.keys(COLOR_SOURCE_BY_MATERIAL)) {
    assert.ok(materialNames.has(name), `${name} is not a material in the model`);
  }
});

// Designs 21-23 are tinted through these; an untinted one renders flat white.
test('every planar-projected material is tintable', () => {
  const planar = [...materialNames].filter(n => /_planar_[xyz]$/i.test(n));

  assert.ok(planar.length > 0, 'expected the model to have planar materials');
  for (const name of planar) {
    assert.ok(
      COLOR_SOURCE_BY_MATERIAL[name],
      `${name} has no color source — it would render white`,
    );
  }
});

// The `_planar_y` materials share one normal-map atlas — vertical grooves in
// its left half, horizontal in its right — and each design's baked TEXCOORD_0
// picks out its own region. That is why they must keep their authored UVs:
// re-projecting them at runtime sweeps a panel across both halves at once.
function uvRange(nodeName) {
  const node = gltf.nodes.find(n => n.name === nodeName);
  const prim = gltf.meshes[node.mesh].primitives
    .find(p => /_planar_[xyz]$/i.test(gltf.materials[p.material]?.name ?? ''));
  assert.ok(prim, `${nodeName} has no planar primitive`);

  const uv = readVec2(prim.attributes.TEXCOORD_0);
  const min = [Infinity, Infinity];
  const max = [-Infinity, -Infinity];
  for (let i = 0; i < uv.length; i += 2) {
    for (const c of [0, 1]) {
      if (uv[i + c] < min[c]) min[c] = uv[i + c];
      if (uv[i + c] > max[c]) max[c] = uv[i + c];
    }
  }
  return { min, max };
}

test('atlas designs keep baked UVs inside the texture', () => {
  for (const id of ['21', '22', '23']) {
    for (const material of MATERIALS) {
      const { min, max } = uvRange(`${material}_door_design_${id}`);
      assert.ok(min[0] >= 0 && min[1] >= 0, `design ${id} ${material} UV below 0: ${min}`);
      assert.ok(max[0] <= 1 && max[1] <= 1, `design ${id} ${material} UV above 1: ${max}`);
    }
  }
});

test('designs 21 and 22 read different halves of the atlas', () => {
  for (const material of MATERIALS) {
    const a = uvRange(`${material}_door_design_21`);
    const b = uvRange(`${material}_door_design_22`);
    assert.ok(
      a.max[0] < b.min[0] || b.max[0] < a.min[0],
      `${material} designs 21 and 22 overlap in U — they should sample different grooves`,
    );
  }
});

test('planar materials carry a base color texture to tint', () => {
  for (const material of gltf.materials) {
    if (!/_planar_[xyz]$/i.test(material.name)) continue;

    const pbr = material.pbrMetallicRoughness ?? {};
    assert.ok(pbr.baseColorTexture, `${material.name} has no base color texture`);
    assert.ok(
      pbr.baseColorFactor === undefined
        || pbr.baseColorFactor.slice(0, 3).every(c => c === 1),
      `${material.name} has a non-white baseColorFactor, which would skew the tint`,
    );
  }
});
