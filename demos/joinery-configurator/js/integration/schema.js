'use strict';

/**
 * Everything the integration contract fixes as data: enums, defaults, size
 * limits, and what the renderer can currently build.
 *
 * Pure — no THREE, no DOM. When Joinery answers the open questions in §8 of the
 * contract, the change should land here and in validate.js, never in a
 * controller.
 */

import { getConstants } from '../product-constants.js';
import { clamp } from '../math-utils.js';
import { DOOR_DESIGN_IDS } from '../door-designs.js';
import { BACK_DOOR_DESIGN_IDS } from '../back-door-designs.js';
import { PRODUCT_TYPE } from './product-type.js';

export const SCHEMA_VERSION = '1.0';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const PRODUCT_TYPES = ['window', 'door', 'backDoor'];
export const RESERVED_PRODUCT_TYPES = ['slidingDoor', 'garageDoor', 'rollerShutter'];

export const LOCALES = ['nl', 'en'];
export const MATERIALS = ['pvc', 'alum'];
export const SERIES = ['70', '120'];
export const OFFSETS = ['zonder', 'met'];
export const COLOR_MODES = ['uniform', 'split'];
export const VIEWS = ['inside', 'outside'];
export const SHAPES = ['rect', 'round'];

export const OPENINGS = [
  'fixed', 'tilt', 'turn_left', 'turn_right', 'tilt_turn_left', 'tilt_turn_right',
];

export const WINDOW_HANDLE_MODELS = [1, 2, 3];
export const HANDLE_COLORS = ['hc_chrome', 'hc_standard_silver', 'hc_black'];
export const GRILLES = ['none', 'g2x2', 'g3x3'];

// Sourced from the design catalogue so the enum can never drift from what the
// model can actually show. Note '2a' is not numeric — these are slugs.
export const DOOR_DESIGN_TYPES = DOOR_DESIGN_IDS;
export const GLASS_TYPES = ['clear', 'blur'];
// 'none' because doors are sold without a handle on one or both faces. A
// string rather than 0 (falsy) or a second boolean field (which could
// contradict this one) — and `grille: 'none'` already set the pattern.
export const DOOR_HANDLES_INSIDE = [1, 2, 'none'];
export const DOOR_HANDLES_OUTSIDE = [1, 2, 3, 'none'];
export const HINGE_TYPES = [1, 2];
export const OPEN_SIDES = ['left', 'right'];

export const BACK_DOOR_DESIGN_TYPES = BACK_DOOR_DESIGN_IDS;

// Narrower than HINGE_TYPES, not equal to it: the back-door GLB ships one
// aluminium hinge model where the front-door GLB ships two.
export { BACK_DOOR_HINGE_TYPES, BACK_DOOR_TRANSOM_DESIGN_IDS as BACK_DOOR_TRANSOM_DESIGN_TYPES }
  from '../back-door-designs.js';

export const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

// ─── Grid limits ──────────────────────────────────────────────────────────────

export const MAX_COLUMNS = 4;
export const MAX_ROWS = 3;

// ─── Defaults ─────────────────────────────────────────────────────────────────
// A field the client omits falls back to these — never to the previous value.

export const DEFAULTS = {
  locale: 'nl',
  offset: 'zonder',
  view: 'inside',
  layout: { transom: false, mullionless: false, shape: 'rect' },
  colSpan: 1,
  window: { handleModel: 1, handleColor: 'hc_chrome', grille: 'none' },
  door: {
    designType: '1', glassType: 'clear', hasWindowFrame: true, openSide: 'left',
    handleInside: 1, handleOutside: 2, handleColor: 'hc_chrome', hingeType: 1,
    hasPost: false, hasVent: false,
  },
  backDoor: {
    designType: '1', hasTransomLight: false, openSide: 'left',
    handleInside: 1, handleOutside: 2, handleColor: 'hc_chrome', hingeType: 1,
  },
};

// ─── Units ────────────────────────────────────────────────────────────────────
// The contract is integer millimetres; the engine works in metres.

export const mmToM = mm => mm / 1000;
export const mToMm = m => Math.round(m * 1000);

// ─── Product type ↔ engine category ──────────────────────────────────────────

const CATEGORY_BY_PRODUCT_TYPE = {
  window: 'windows',
  door: 'doors',
  backDoor: 'backDoors',
};

export const toCategory = productType => CATEGORY_BY_PRODUCT_TYPE[productType];
export const toProductType = category =>
  Object.keys(CATEGORY_BY_PRODUCT_TYPE).find(k => CATEGORY_BY_PRODUCT_TYPE[k] === category);

// Contract grille slugs vs the engine's own naming.
const GRILLE_TO_STATE = { none: 'none', g2x2: '2x2', g3x3: '3x3' };

export const toStateGrille = g => GRILLE_TO_STATE[g] ?? 'none';
export const fromStateGrille = g =>
  Object.keys(GRILLE_TO_STATE).find(k => GRILLE_TO_STATE[k] === g) ?? 'none';

// ─── Size limits ──────────────────────────────────────────────────────────────
// Sourced from product-constants.js, which is the deformation range each GLB is
// actually built for. Never restate the numbers here.

/**
 * Sizes Joinery will not sell, tighter than what the geometry can morph to.
 *
 * Deliberately not folded into product-constants: the numbers there are morph
 * calibration — `interpolateValue(raw, frameMinHeight, frameMaxHeight)` maps the
 * slider onto the shape keys — so raising frameMinHeight to 2000 would drive the
 * morph authored for 1800mm and render every aluminium door 200mm short.
 */
const SALES_MIN_HEIGHT_MM = { door: { alum: 2000 } };

/**
 * @returns {{widthMm: {min, max}, heightMm: {min, max}}} in integer millimetres.
 */
export function sizeLimitsFor(productType, material, series) {
  const C = getConstants(toCategory(productType), material, series);
  const salesMinHeight = SALES_MIN_HEIGHT_MM[productType]?.[material] ?? 0;

  return {
    widthMm: { min: mToMm(C.frameMinWidth), max: mToMm(C.frameMaxWidth) },
    heightMm: {
      min: Math.max(mToMm(C.frameMinHeight), salesMinHeight),
      max: mToMm(C.frameMaxHeight),
    },
  };
}

/** Bound to the product this build renders. */
export const sizeLimits = (material, series) =>
  sizeLimitsFor(PRODUCT_TYPE, material, series);

// A window is divided into `columns` panels of equal width, and each panel has
// its own authored minimum. Below it the width morph goes negative, which
// three.js extrapolates rather than clamps — the panel inverts instead of
// stopping. Measured against the current GLB by finding where the panel morph
// crosses zero: 1 col 400mm, 2 col 775mm, 3 col 1150mm, 4 col 1525mm.
//
// NOTE: contract §5 quotes a flat 400mm minimum for every window. That is only
// correct for a single column and needs amending.
const MIN_WIDTH_PER_EXTRA_COLUMN_MM = 375;

export function minWidthMmForColumnsFor(productType, material, series, columns = 1) {
  const base = sizeLimitsFor(productType, material, series).widthMm.min;
  if (productType !== 'window') return base;

  return base + MIN_WIDTH_PER_EXTRA_COLUMN_MM * (Math.max(1, columns) - 1);
}

export const minWidthMmForColumns = (material, series, columns = 1) =>
  minWidthMmForColumnsFor(PRODUCT_TYPE, material, series, columns);

/**
 * Clamps a dimension to its valid range.
 * @returns {{value: number, clamped: boolean, bound: number|null}}
 */
export function clampDimension(sentMm, min, max) {
  const value = clamp(sentMm, min, max);
  if (value === sentMm) return { value, clamped: false, bound: null };

  return { value, clamped: true, bound: value === max ? max : min };
}

// ─── Renderer coverage ────────────────────────────────────────────────────────

/**
 * What the engine can build today. Anything false here is a valid contract
 * payload that still returns UNSUPPORTED_LAYOUT — §7 of the contract.
 *
 * @returns {{ok: boolean, reason: string|null}}
 */
export function isRenderable(layout) {
  if (layout.shape === 'round') {
    return { ok: false, reason: 'round windows have no 3D model yet' };
  }

  return { ok: true, reason: null };
}
