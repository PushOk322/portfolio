import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readGlb, nodeBounds, morphNames, morphDelta } from './glb.mjs';
import {
  BACK_DOOR_DESIGN_IDS, BACK_DOOR_PREFIXES, BACK_DOOR_MORPH_SUFFIXES,
  BACK_DOOR_NODE_OVERRIDES, BACK_DOOR_TRANSOM_DESIGN_IDS,
  designNode, leafNode, allowsTransom,
} from '../js/back-door-designs.js';
import { COLOR_SOURCE_BY_MATERIAL } from '../js/door-designs.js';

const MODEL = path.join(
  path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'models', 'door_demo_back.glb',
);

const { json: gltf } = readGlb(MODEL);
const nodeNames = new Set(gltf.nodes.map(n => n.name));
const materialNames = new Set(gltf.materials.map(m => m.name));

// The name the controller ends up asking for, after the override map.
const resolve = name => BACK_DOOR_NODE_OVERRIDES[name] ?? name;

// Alum frames ship a `_zonder` suffix and pvc frames ship none.
const hasFrame = base => nodeNames.has(base) || nodeNames.has(`${base}_zonder`);

test('every catalogued design has a leaf and a frame in every prefix', () => {
  for (const id of BACK_DOOR_DESIGN_IDS) {
    for (const prefix of BACK_DOOR_PREFIXES) {
      const design = designNode(id);

      assert.ok(nodeNames.has(`${prefix}door_${design}_back`),
        `missing ${prefix}door_${design}_back`);
      assert.ok(hasFrame(`${prefix}door_${design}_back_frame`),
        `missing ${prefix}door_${design}_back_frame (with or without _zonder)`);
    }
  }
});

test('the transom frame exists in every prefix', () => {
  for (const prefix of BACK_DOOR_PREFIXES) {
    assert.ok(hasFrame(resolve(`${prefix}door_window_back_frame`)),
      `missing ${prefix}door_window_back_frame (with or without _zonder)`);
  }
});

// A design id with no node segment builds `door_undefined_back` and silently
// shows nothing.
test('every design id resolves to a node segment', () => {
  for (const id of BACK_DOOR_DESIGN_IDS) {
    assert.ok(designNode(id), `design ${id} has no node segment`);
  }
});

// pvc_120's window pair is name-swapped in the GLB: the `_back`-named node
// holds the frame. Asserted by geometry, not by name, so the override can be
// deleted the moment a re-export fixes it.
test('the pvc_120 window override is still needed', () => {
  const leafName = 'pvc_120_door_window_back_frame';
  const frameName = 'pvc_120_door_window_back';

  const leaf = nodeBounds(gltf, leafName);
  const frame = nodeBounds(gltf, frameName);

  assert.ok(leaf && frame, 'both pvc_120 window nodes must exist');
  assert.ok(
    frame.max[1] > leaf.max[1],
    `${frameName} is no longer taller than ${leafName} — the swap is fixed, ` +
    'drop BACK_DOOR_NODE_OVERRIDES',
  );

  assert.equal(BACK_DOOR_NODE_OVERRIDES['pvc_120_door_window_back'], leafName);
  assert.equal(BACK_DOOR_NODE_OVERRIDES['pvc_120_door_window_back_frame'], frameName);
});

// The pattern a controller builds the hinge name from: aluminium gets a `1_`
// slot (it has only one hinge model), PVC gets none. This is the test whose
// absence let a wrong hinge name through in the first place.
test('every prefix has a hinge frame and move node under the documented pattern', () => {
  for (const prefix of BACK_DOOR_PREFIXES) {
    const slot = prefix === 'alum_' ? '1_' : '';
    const frame = `${prefix}door_back_hinge_${slot}frame`;
    const move = `${prefix}door_back_hinge_${slot}move`;

    assert.ok(nodeNames.has(frame), `missing ${frame}`);
    assert.ok(nodeNames.has(move), `missing ${move}`);
  }
});

// Fails the moment a re-export adds a second aluminium hinge model — that's
// the signal to widen BACK_DOOR_HINGE_TYPES beyond [1].
test('no second aluminium hinge model exists yet', () => {
  const secondHinge = [...nodeNames].filter(name => /_back_hinge_2_/.test(name));
  assert.deepEqual(secondHinge, [],
    'a second aluminium hinge model appeared — widen BACK_DOOR_HINGE_TYPES in js/back-door-designs.js');
});

// One normalised value is written to all four names per prefix, which is what
// makes pvc_70's misnamed targets harmless. A fifth name would go unwritten.
test('every morph target is one of the four expected names for its prefix', () => {
  const expected = new Set(
    BACK_DOOR_PREFIXES.flatMap(p => BACK_DOOR_MORPH_SUFFIXES.map(s => `${p}${s}`)),
  );

  for (const name of nodeNames) {
    for (const morph of morphNames(gltf, name)) {
      assert.ok(expected.has(morph),
        `${name} declares morph "${morph}", which no controller writes`);
    }
  }
});

// rubber, metal, white_plastic, glass_clear and alum are deliberately untinted,
// so the reverse assertion door-designs.test.mjs makes does not apply here.
test('the tintable materials are present, so a colour change reaches geometry', () => {
  const tintable = Object.keys(COLOR_SOURCE_BY_MATERIAL)
    .filter(name => materialNames.has(name))
    .sort();

  assert.deepEqual(
    tintable, ['color_inside', 'color_outside', 'uPVC'].sort(),
    'the back GLB should carry exactly the three plain tintable materials',
  );
});

// ─── The bovenlicht pair ──────────────────────────────────────────────────────

// The transom is a matched leaf+frame pair, not a taller frame over the design's
// leaf. Each pair deforms by its own delta — mixing them costs the leaf its head
// rebate and opens daylight above it, which is exactly the bug this pins.
test('each frame shares a height-morph delta with the leaf it is paired with', () => {
  for (const prefix of BACK_DOOR_PREFIXES) {
    const pairs = [
      ...BACK_DOOR_DESIGN_IDS.map(id => [`door_${designNode(id)}_back`, `design ${id}`]),
      ['door_window_back', 'transom'],
    ];

    for (const [base, label] of pairs) {
      const leaf = morphDelta(gltf, resolve(`${prefix}${base}`), 'height');
      const frameName = [`${prefix}${base}_frame_zonder`, `${prefix}${base}_frame`]
        .find(n => nodeNames.has(resolve(n)));
      const frame = morphDelta(gltf, resolve(frameName), 'height');

      assert.ok(Number.isFinite(leaf) && Number.isFinite(frame),
        `${prefix}${base} (${label}) is missing a height morph on one half of the pair`);
      assert.ok(Math.abs(leaf - frame) < 0.0005,
        `${prefix}${base} (${label}): leaf morphs ${(leaf * 1000).toFixed(1)}mm but its ` +
        `frame morphs ${(frame * 1000).toFixed(1)}mm — they must travel together`);
    }
  }
});

// If a re-export ever equalises these, the leaf swap stops being load-bearing
// and this test is the place that says so.
test('the transom pair deforms differently from the design pair', () => {
  for (const prefix of BACK_DOOR_PREFIXES) {
    const design = morphDelta(gltf, resolve(`${prefix}door_${designNode('1')}_back`), 'height');
    const transom = morphDelta(gltf, resolve(`${prefix}door_window_back`), 'height');

    assert.notEqual(design, transom,
      `${prefix}: the transom leaf now morphs like the design leaf — the pairing in ` +
      'js/back-door-designs.js can be simplified');
  }
});

test('the bovenlicht selects its own leaf, whatever the design', () => {
  for (const id of BACK_DOOR_DESIGN_IDS) {
    assert.equal(leafNode(id, false), designNode(id));
    assert.equal(leafNode(id, true), 'window',
      `design ${id} with a bovenlicht must use the transom leaf`);
  }
});

// Joinery does not sell half glass with a bovenlicht and the GLB has no leaf for it,
// so the catalogue has to say which designs the flag is offered on.
test('only full glass is sold with a bovenlicht', () => {
  assert.deepEqual([...BACK_DOOR_TRANSOM_DESIGN_IDS], ['1']);
  assert.equal(allowsTransom('1'), true);
  assert.equal(allowsTransom('2'), false);
});
