'use strict';

/**
 * The back-door catalogue, mirroring what src/models/door_demo_back.glb ships.
 *
 * Two leaf designs, plus the bovenlicht ("with window") as a third leaf+frame
 * pair. The transom is NOT just a taller frame over the design's leaf: each
 * pair is authored to its own height-morph delta, so mixing halves costs the
 * leaf its head rebate and opens daylight above it.
 *
 * tests/back-door-designs.test.mjs asserts all of this against the GLB.
 */

export const BACK_DOOR_DESIGNS = Object.freeze({
  '1': Object.freeze({ node: 'glass', label: 'Full glass' }),
  '2': Object.freeze({ node: 'half_glass', label: 'Half glass' }),
});

export const BACK_DOOR_DESIGN_IDS = Object.freeze(Object.keys(BACK_DOOR_DESIGNS));

export const designNode = id => BACK_DOOR_DESIGNS[id]?.node ?? null;

/** The node segment the bovenlicht leaf and frame share. */
export const BACK_DOOR_TRANSOM_NODE = 'window';

// Joinery does not sell half glass with a bovenlicht, and the GLB carries no leaf
// for it either — there is one transom leaf per prefix and it is full-glass.
export const BACK_DOOR_TRANSOM_DESIGN_IDS = Object.freeze(['1']);

export const allowsTransom = id => BACK_DOOR_TRANSOM_DESIGN_IDS.includes(id);

/**
 * Node segment for the leaf. The bovenlicht overrides the design because it
 * brings its own leaf, matched to the transom frame's deformation.
 */
export const leafNode = (id, hasTransomLight) =>
  hasTransomLight ? BACK_DOOR_TRANSOM_NODE : designNode(id);

export const BACK_DOOR_PREFIXES = Object.freeze(['alum_', 'pvc_70_', 'pvc_120_']);

// One normalised value is written to all four per prefix. Leaf and frame deform
// by the same delta over the same interval — the leaf just sits inset — so a
// single value is correct for both. Writing all four also covers the swapped
// pvc_120 window pair, whose nodes carry each other's morph names.
export const BACK_DOOR_MORPH_SUFFIXES = Object.freeze([
  'door_back_width',
  'door_back_frame_width',
  'door_back_height',
  'door_back_frame_height',
]);

/**
 * Nodes whose name and geometry disagree, mapped to the node that actually
 * holds the geometry the name promises.
 *
 * Unlike door-designs' DESIGN_NODE_ALIASES this is not a fallback — the wrong
 * name resolves perfectly well, it just returns the other half of the pair —
 * so it is applied unconditionally. A modelling defect to fix on the next
 * export, not a second convention.
 */
export const BACK_DOOR_NODE_OVERRIDES = Object.freeze({
  pvc_120_door_window_back: 'pvc_120_door_window_back_frame',
  pvc_120_door_window_back_frame: 'pvc_120_door_window_back',
});

// The back-door GLB ships one aluminium hinge model where the front-door GLB
// ships two. PVC has never had a choice.
export const BACK_DOOR_HINGE_TYPES = Object.freeze([1]);

/** Applies the node-override map. */
export function resolveBackDoorNode(name) {
  return BACK_DOOR_NODE_OVERRIDES[name] ?? name;
}
