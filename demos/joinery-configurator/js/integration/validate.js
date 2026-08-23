'use strict';

/**
 * Turns a client payload into either a list of errors or a normalised
 * configuration, without touching the scene.
 *
 * The all-or-nothing guarantee in §1 of the contract falls out of this being
 * side-effect free: applyConfiguration only mutates state once this has
 * returned clean, so a rejected payload leaves the previous render alone.
 *
 * Order matters — required/enum, then structure, then clamping (which needs the
 * column count), then cross-field rules, then renderer capability.
 */

import {
  SCHEMA_VERSION, PRODUCT_TYPES, RESERVED_PRODUCT_TYPES, LOCALES, MATERIALS,
  SERIES, OFFSETS, COLOR_MODES, VIEWS, SHAPES, OPENINGS, WINDOW_HANDLE_MODELS,
  HANDLE_COLORS, GRILLES, DOOR_DESIGN_TYPES, GLASS_TYPES, DOOR_HANDLES_INSIDE,
  DOOR_HANDLES_OUTSIDE, HINGE_TYPES, OPEN_SIDES, HEX_PATTERN, MAX_COLUMNS,
  MAX_ROWS, DEFAULTS, sizeLimitsFor, minWidthMmForColumnsFor, clampDimension,
  isRenderable, BACK_DOOR_DESIGN_TYPES, BACK_DOOR_HINGE_TYPES,
  BACK_DOOR_TRANSOM_DESIGN_TYPES,
} from './schema.js';

import { ERROR_CODES as E, WARNING_CODES as W, entry } from './codes.js';
import { designSupportsGlass, designSupportsWindowFrame } from '../door-designs.js';

const ENVELOPE_KEYS = [
  'schemaVersion', 'productType', 'locale', 'dimensions', 'profile', 'colors',
  'presentation', 'options', 'imageUrl',
];

const WINDOW_OPTION_KEYS = ['layout', 'handleModel', 'handleColor', 'grille'];

const DOOR_OPTION_KEYS = [
  'designType', 'glassType', 'hasWindowFrame', 'openSide', 'handleInside',
  'handleOutside', 'handleColor', 'hingeType', 'hasPost', 'hasVent',
];

const BACK_DOOR_OPTION_KEYS = [
  'designType', 'hasTransomLight', 'openSide', 'handleInside', 'handleOutside',
  'handleColor', 'hingeType',
];

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * @param {object} payload
 * @param {string} productType  supplied by the caller, not the payload — the
 *   script Joinery loaded decides it.
 * @returns {{ok: boolean, errors: Array, warnings: Array, normalized: object|null}}
 */
export function validate(payload, productType) {
  if (!PRODUCT_TYPES.includes(productType)) {
    throw new Error(`[Configurator] validate() needs a product type, got "${productType}".`);
  }

  const errors = [];
  const warnings = [];

  const locale = LOCALES.includes(payload?.locale) ? payload.locale : DEFAULTS.locale;

  const err = (code, ctx) => errors.push(entry(code, { locale, ...ctx }));
  const warn = (code, ctx) => warnings.push(entry(code, { locale, ...ctx }));

  if (!isObject(payload)) {
    err(E.MISSING_FIELD, { field: 'payload' });
    return { ok: false, errors, warnings, normalized: null };
  }

  // ── imageUrl ───────────────────────────────────────────────────────────────
  // A short circuit, not a field among fields. Joinery sends it for products we
  // cannot render, so nothing else in the payload is worth reading — not even
  // schemaVersion. Everything below is skipped deliberately.
  if (payload.imageUrl !== undefined) {
    const imageUrl = normalizeImageUrl(payload.imageUrl, { err });
    if (!imageUrl) return { ok: false, errors, warnings, normalized: null };

    return {
      ok: true,
      errors: [],
      warnings: [],
      normalized: { schemaVersion: SCHEMA_VERSION, imageUrl },
    };
  }

  if (payload.locale !== undefined && !LOCALES.includes(payload.locale)) {
    err(E.INVALID_ENUM, { field: 'locale', sent: payload.locale, allowed: LOCALES });
  }

  // ── schemaVersion ──────────────────────────────────────────────────────────
  if (payload.schemaVersion === undefined) {
    err(E.MISSING_FIELD, { field: 'schemaVersion' });
  } else if (payload.schemaVersion !== SCHEMA_VERSION) {
    err(E.INVALID_ENUM, {
      field: 'schemaVersion', sent: payload.schemaVersion, allowed: [SCHEMA_VERSION],
    });
  }

  // ── productType ────────────────────────────────────────────────────────────
  // Not a field any more. A stale one is ignored, but one naming a *different*
  // product is the "backend served the wrong script" bug and earns its own
  // code: a window payload reaching the door build would otherwise render a
  // plain default door without complaint, since every door option has one.
  if (payload.productType !== undefined) {
    const sent = payload.productType;

    if (sent !== productType && [...PRODUCT_TYPES, ...RESERVED_PRODUCT_TYPES].includes(sent)) {
      warn(W.WRONG_PRODUCT_TYPE, { field: 'productType', sent, applied: productType });
    } else {
      warn(W.FIELD_IGNORED, {
        field: 'productType', sent, applied: productType,
        reason: 'the script you loaded decides the product type',
      });
    }
  }

  unknownKeys(payload, ENVELOPE_KEYS).forEach(key =>
    warn(W.FIELD_IGNORED, { field: key, reason: 'not part of the envelope' }));

  const profile = validateProfile(payload.profile, { err, warn });
  const colors = validateColors(payload.colors, { err });
  const view = optionalEnum(payload.presentation?.view, VIEWS, 'presentation.view', DEFAULTS.view, err);

  const options = payload.options;
  if (!isObject(options)) {
    err(E.MISSING_FIELD, { field: 'options' });
  }

  const normalizedOptions = productType === 'window'
    ? validateWindowOptions(options, { err, warn })
    : productType === 'door'
      ? validateDoorOptions(options, profile, { err, warn })
      : validateBackDoorOptions(options, { err, warn });

  // ── Dimensions ─────────────────────────────────────────────────────────────
  // After layout, because a window's minimum width scales with column count.
  const columns = normalizedOptions?.layout?.columns ?? 1;
  const dimensions = validateDimensions(
    payload.dimensions, productType, profile, columns, { err, warn },
  );

  // ── Renderer capability ────────────────────────────────────────────────────
  if (productType === 'window' && normalizedOptions?.layout) {
    const { ok, reason } = isRenderable(normalizedOptions.layout);
    if (!ok) err(E.UNSUPPORTED_LAYOUT, { field: 'options.layout', reason });
  }

  if (errors.length) return { ok: false, errors, warnings, normalized: null };

  return {
    ok: true,
    errors,
    warnings,
    normalized: {
      schemaVersion: SCHEMA_VERSION,
      locale,
      dimensions,
      profile,
      colors,
      presentation: { view },
      options: normalizedOptions,
    },
  };
}

// ─── Envelope pieces ──────────────────────────────────────────────────────────

function validateProfile(profile, { err, warn }) {
  if (!isObject(profile)) {
    err(E.MISSING_FIELD, { field: 'profile' });
    return { material: 'pvc', series: '70', offset: DEFAULTS.offset };
  }

  const material = requiredEnum(profile.material, MATERIALS, 'profile.material', err) ?? 'pvc';
  let series = requiredEnum(profile.series, SERIES, 'profile.series', err) ?? '70';
  let offset = optionalEnum(profile.offset, OFFSETS, 'profile.offset', DEFAULTS.offset, err);

  // Aluminium ships the 70 series only.
  if (material === 'alum' && series !== '70') {
    warn(W.FIELD_IGNORED, {
      field: 'profile.series', sent: series, applied: '70',
      reason: 'aluminium ships the 70 series only',
    });
    series = '70';
  }

  // No GLB ships a `*_frame_met` node — doors and windows alike only have
  // `_zonder`. Both controllers resolve the frame by name, so `met` reaches
  // them as a lookup that finds nothing and the product renders with no frame
  // at all. Coerce here, once, rather than in each controller.
  // Remove when the models are re-exported with an offset frame.
  if (offset === 'met') {
    warn(W.FIELD_IGNORED, {
      field: 'profile.offset', sent: offset, applied: 'zonder',
      reason: 'the offset frame is not modelled yet',
    });
    offset = 'zonder';
  }

  return { material, series, offset };
}

/**
 * Joinery always sends an exterior and an interior colour, so `colors.mode` is
 * optional: absent means split. A payload carrying only `uniformHex` is still
 * read as uniform, which keeps the older single-colour form valid.
 */
function validateColors(colors, { err }) {
  if (!isObject(colors)) {
    err(E.MISSING_FIELD, { field: 'colors' });
    return { mode: 'split', exteriorHex: '#FFFFFF', interiorHex: '#FFFFFF' };
  }

  const mode = colors.mode == null
    ? (colors.uniformHex != null && colors.exteriorHex == null ? 'uniform' : 'split')
    : requiredEnum(colors.mode, COLOR_MODES, 'colors.mode', err);

  if (mode === 'uniform') {
    return { mode, uniformHex: requiredHex(colors.uniformHex, 'colors.uniformHex', err) };
  }

  if (mode === 'split') {
    return {
      mode,
      exteriorHex: requiredHex(colors.exteriorHex, 'colors.exteriorHex', err),
      interiorHex: requiredHex(colors.interiorHex, 'colors.interiorHex', err),
    };
  }

  // Unreachable via requiredEnum, which has already errored on a bad mode.
  return { mode: 'split', exteriorHex: '#FFFFFF', interiorHex: '#FFFFFF' };
}

function validateDimensions(dimensions, productType, profile, columns, { err, warn }) {
  if (!isObject(dimensions)) {
    err(E.MISSING_FIELD, { field: 'dimensions' });
    return { widthMm: 0, heightMm: 0 };
  }

  const limits = sizeLimitsFor(productType, profile.material, profile.series);
  const profileLabel = `${profile.material} ${profile.series}`;

  const widthMin = minWidthMmForColumnsFor(productType, profile.material, profile.series, columns);

  return {
    widthMm: dimension(dimensions.widthMm, 'dimensions.widthMm',
      widthMin, limits.widthMm.max, profileLabel, columns, { err, warn }),
    heightMm: dimension(dimensions.heightMm, 'dimensions.heightMm',
      limits.heightMm.min, limits.heightMm.max, profileLabel, columns, { err, warn }),
  };
}

function dimension(sent, field, min, max, profileLabel, columns, { err, warn }) {
  if (sent === undefined) {
    err(E.MISSING_FIELD, { field });
    return min;
  }

  if (!Number.isInteger(sent)) {
    err(E.INVALID_ENUM, { field, sent, allowed: ['an integer number of millimetres'] });
    return min;
  }

  const { value, clamped, bound } = clampDimension(sent, min, max);

  if (clamped) {
    // Naming the column count matters: the same width is legal at 2 columns and
    // clamped at 4, and without it the message looks like it contradicts §5.
    const profile = columns > 1 ? `${profileLabel} at ${columns} columns` : profileLabel;
    warn(W.DIMENSION_CLAMPED, { field, sent, applied: value, bound, profile });
  }

  return value;
}

// ─── Window options ───────────────────────────────────────────────────────────

function validateWindowOptions(options, { err, warn }) {
  if (!isObject(options)) return null;

  unknownKeys(options, WINDOW_OPTION_KEYS).forEach(key =>
    warn(W.FIELD_IGNORED, { field: `options.${key}`, reason: 'not a window option' }));

  return {
    layout: validateLayout(options.layout, { err }),
    handleModel: optionalEnum(options.handleModel, WINDOW_HANDLE_MODELS,
      'options.handleModel', DEFAULTS.window.handleModel, err),
    handleColor: optionalEnum(options.handleColor, HANDLE_COLORS,
      'options.handleColor', DEFAULTS.window.handleColor, err),
    grille: optionalEnum(options.grille, GRILLES,
      'options.grille', DEFAULTS.window.grille, err),
  };
}

function validateLayout(layout, { err }) {
  if (!isObject(layout)) {
    err(E.MISSING_FIELD, { field: 'options.layout' });
    return null;
  }

  const columns = boundedInt(layout.columns, 1, MAX_COLUMNS, 'options.layout.columns', err);
  const rows = boundedInt(layout.rows, 1, MAX_ROWS, 'options.layout.rows', err);

  const normalized = {
    columns: columns ?? 1,
    rows: rows ?? 1,
    transom: boolOr(layout.transom, DEFAULTS.layout.transom, 'options.layout.transom', err),
    mullionless: boolOr(layout.mullionless, DEFAULTS.layout.mullionless, 'options.layout.mullionless', err),
    shape: optionalEnum(layout.shape, SHAPES, 'options.layout.shape', DEFAULTS.layout.shape, err),
    sections: [],
  };

  if (columns === null || rows === null) return normalized;

  normalized.sections = validateSections(layout.sections, columns, rows, { err });
  return normalized;
}

function validateSections(sections, columns, rows, { err }) {
  if (!Array.isArray(sections)) {
    err(E.MISSING_FIELD, { field: 'options.layout.sections' });
    return [];
  }

  // occupancy[row][col] — every cell must be claimed exactly once.
  const occupancy = Array.from({ length: rows }, () => new Array(columns).fill(false));
  const normalized = [];

  sections.forEach((section, i) => {
    const at = `options.layout.sections[${i}]`;

    if (!isObject(section)) {
      err(E.SECTION_COUNT_MISMATCH, { field: at, reason: 'section is not an object' });
      return;
    }

    const row = boundedInt(section.row, 0, rows - 1, `${at}.row`, err);
    const col = boundedInt(section.col, 0, columns - 1, `${at}.col`, err);
    const colSpan = section.colSpan === undefined ? DEFAULTS.colSpan
      : boundedInt(section.colSpan, 1, columns, `${at}.colSpan`, err);

    const opening = requiredEnum(section.opening, OPENINGS, `${at}.opening`, err);

    if (row === null || col === null || colSpan === null) return;

    if (col + colSpan > columns) {
      err(E.SECTION_COUNT_MISMATCH, {
        field: `${at}.colSpan`, sent: colSpan,
        reason: `section at row ${row}, col ${col} spans past the last column`,
      });
      return;
    }

    for (let c = col; c < col + colSpan; c++) {
      if (occupancy[row][c]) {
        err(E.SECTION_COUNT_MISMATCH, {
          field: at, reason: `cell (row ${row}, col ${c}) is covered more than once`,
        });
        return;
      }
      occupancy[row][c] = true;
    }

    normalized.push({ row, col, colSpan, opening: opening ?? 'fixed' });
  });

  const gaps = [];
  occupancy.forEach((cells, row) =>
    cells.forEach((filled, col) => { if (!filled) gaps.push(`(row ${row}, col ${col})`); }));

  if (gaps.length) {
    err(E.SECTION_COUNT_MISMATCH, {
      field: 'options.layout.sections',
      reason: `no section covers ${gaps.join(', ')}`,
    });
  }

  return normalized;
}

// ─── Door options ─────────────────────────────────────────────────────────────

function validateDoorOptions(options, profile, { err, warn }) {
  if (!isObject(options)) return null;

  unknownKeys(options, DOOR_OPTION_KEYS).forEach(key =>
    warn(W.FIELD_IGNORED, { field: `options.${key}`, reason: 'not a door option' }));

  const hasPost = boolOr(options.hasPost, DEFAULTS.door.hasPost, 'options.hasPost', err);
  const hasVent = boolOr(options.hasVent, DEFAULTS.door.hasVent, 'options.hasVent', err);

  if (hasPost && hasVent) {
    err(E.MUTUALLY_EXCLUSIVE, { field: 'options.hasVent', sent: true });
  }

  // PVC doors use a fixed hinge system with no model choice.
  let hingeType = optionalEnum(options.hingeType, HINGE_TYPES,
    'options.hingeType', DEFAULTS.door.hingeType, err);

  if (profile.material !== 'alum' && options.hingeType !== undefined) {
    warn(W.FIELD_IGNORED, {
      field: 'options.hingeType', sent: options.hingeType,
      reason: 'PVC doors have no hinge model choice',
    });
    hingeType = DEFAULTS.door.hingeType;
  }

  const designType = optionalEnum(options.designType, DOOR_DESIGN_TYPES,
    'options.designType', DEFAULTS.door.designType, err);

  // Glass and the window frame are per-design, so a client asking for either on
  // a design that has neither gets told rather than silently losing the choice.
  let glassType = optionalEnum(options.glassType, GLASS_TYPES,
    'options.glassType', DEFAULTS.door.glassType, err);

  if (designType && !designSupportsGlass(designType) && options.glassType !== undefined) {
    warn(W.FIELD_IGNORED, {
      field: 'options.glassType', sent: options.glassType,
      reason: `design ${designType} has no glass`,
    });
    glassType = DEFAULTS.door.glassType;
  }

  let hasWindowFrame = boolOr(options.hasWindowFrame, DEFAULTS.door.hasWindowFrame,
    'options.hasWindowFrame', err);

  if (designType && !designSupportsWindowFrame(designType) && hasWindowFrame) {
    warn(W.FIELD_IGNORED, {
      field: 'options.hasWindowFrame', sent: options.hasWindowFrame,
      reason: `design ${designType} has no window frame`,
    });
    hasWindowFrame = false;
  }

  return {
    designType,
    glassType,
    hasWindowFrame,
    openSide: optionalEnum(options.openSide, OPEN_SIDES,
      'options.openSide', DEFAULTS.door.openSide, err),
    handleInside: optionalEnum(options.handleInside, DOOR_HANDLES_INSIDE,
      'options.handleInside', DEFAULTS.door.handleInside, err),
    handleOutside: optionalEnum(options.handleOutside, DOOR_HANDLES_OUTSIDE,
      'options.handleOutside', DEFAULTS.door.handleOutside, err),
    handleColor: optionalEnum(options.handleColor, HANDLE_COLORS,
      'options.handleColor', DEFAULTS.door.handleColor, err),
    hingeType,
    hasPost,
    hasVent,
  };
}

// ─── Back-door options ────────────────────────────────────────────────────────

function validateBackDoorOptions(options, { err, warn }) {
  if (!isObject(options)) return null;

  unknownKeys(options, BACK_DOOR_OPTION_KEYS).forEach(key =>
    warn(W.FIELD_IGNORED, { field: `options.${key}`, reason: 'not a back-door option' }));

  // Back doors have no hinge model choice in either material: PVC never did,
  // and this GLB ships only the one aluminium hinge. Warned and coerced rather
  // than rejected, matching how `alum` + series 120 is handled in
  // validateProfile — a legal value the model cannot render.
  let hingeType = optionalEnum(options.hingeType, HINGE_TYPES,
    'options.hingeType', DEFAULTS.backDoor.hingeType, err);

  if (options.hingeType !== undefined && !BACK_DOOR_HINGE_TYPES.includes(hingeType)) {
    warn(W.FIELD_IGNORED, {
      field: 'options.hingeType', sent: options.hingeType,
      applied: DEFAULTS.backDoor.hingeType,
      reason: 'back doors ship one hinge model per material',
    });
    hingeType = DEFAULTS.backDoor.hingeType;
  }

  const hasTransomLight = boolOr(options.hasTransomLight, DEFAULTS.backDoor.hasTransomLight,
    'options.hasTransomLight', err);

  let designType = optionalEnum(options.designType, BACK_DOOR_DESIGN_TYPES,
    'options.designType', DEFAULTS.backDoor.designType, err);

  // The bovenlicht is a leaf-and-frame pair, not a band bolted onto the design's
  // leaf, and the model carries only a full-glass one. Joinery does not sell the
  // combination either, so it is coerced rather than rejected, like hingeType.
  if (hasTransomLight && !BACK_DOOR_TRANSOM_DESIGN_TYPES.includes(designType)) {
    warn(W.FIELD_IGNORED, {
      field: 'options.designType', sent: designType,
      applied: BACK_DOOR_TRANSOM_DESIGN_TYPES[0],
      reason: 'a bovenlicht is only sold with full glass',
    });
    designType = BACK_DOOR_TRANSOM_DESIGN_TYPES[0];
  }

  return {
    designType,
    hasTransomLight,
    openSide: optionalEnum(options.openSide, OPEN_SIDES,
      'options.openSide', DEFAULTS.backDoor.openSide, err),
    handleInside: optionalEnum(options.handleInside, DOOR_HANDLES_INSIDE,
      'options.handleInside', DEFAULTS.backDoor.handleInside, err),
    handleOutside: optionalEnum(options.handleOutside, DOOR_HANDLES_OUTSIDE,
      'options.handleOutside', DEFAULTS.backDoor.handleOutside, err),
    handleColor: optionalEnum(options.handleColor, HANDLE_COLORS,
      'options.handleColor', DEFAULTS.backDoor.handleColor, err),
    hingeType,
  };
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function unknownKeys(obj, known) {
  return isObject(obj) ? Object.keys(obj).filter(k => !known.includes(k)) : [];
}

function requiredEnum(value, allowed, field, err) {
  if (value === undefined) {
    err(E.MISSING_FIELD, { field });
    return null;
  }
  if (!allowed.includes(value)) {
    err(E.INVALID_ENUM, { field, sent: value, allowed });
    return null;
  }
  return value;
}

function optionalEnum(value, allowed, field, fallback, err) {
  if (value === undefined) return fallback;
  if (!allowed.includes(value)) {
    err(E.INVALID_ENUM, { field, sent: value, allowed });
    return fallback;
  }
  return value;
}

function requiredHex(value, field, err) {
  if (value === undefined) {
    err(E.MISSING_FIELD, { field });
    return null;
  }
  if (typeof value !== 'string' || !HEX_PATTERN.test(value)) {
    err(E.INVALID_ENUM, { field, sent: value, allowed: ['#RRGGBB'] });
    return null;
  }
  return value.toUpperCase();
}

function boundedInt(value, min, max, field, err) {
  if (value === undefined) {
    err(E.MISSING_FIELD, { field });
    return null;
  }
  if (!Number.isInteger(value) || value < min || value > max) {
    err(E.INVALID_ENUM, { field, sent: value, allowed: [`an integer ${min}–${max}`] });
    return null;
  }
  return value;
}

function boolOr(value, fallback, field, err) {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') {
    err(E.INVALID_ENUM, { field, sent: value, allowed: [true, false] });
    return fallback;
  }
  return value;
}

const URL_SCHEME = /^([a-z][a-z0-9+.-]*):/i;

// The HTML URL parser strips these before reading a scheme, so a string
// carrying one (e.g. "java\tscript:alert(1)") would otherwise slip past
// URL_SCHEME here and reach the DOM as something else entirely.
// eslint-disable-next-line no-control-regex -- matching control chars is the point
const C0_CONTROLS = /[\x00-\x1f]/g;

/**
 * A `javascript:` URI in an <img src> does not execute, but there is no reason
 * to let an arbitrary scheme reach the DOM. No scheme at all means relative,
 * which resolves against the host page like any other image.
 */
function normalizeImageUrl(sent, { err }) {
  if (typeof sent !== 'string' || sent.trim() === '') {
    err(E.INVALID_IMAGE_URL, {
      field: 'imageUrl', sent, reason: 'expected a non-empty string',
    });
    return null;
  }

  const url = sent.trim().replace(C0_CONTROLS, '');
  const scheme = url.match(URL_SCHEME)?.[1]?.toLowerCase();

  if (scheme && scheme !== 'http' && scheme !== 'https' && !/^data:image\//i.test(url)) {
    err(E.INVALID_IMAGE_URL, {
      field: 'imageUrl', sent: url, reason: `"${scheme}:" URLs are not accepted`,
    });
    return null;
  }

  return url;
}
