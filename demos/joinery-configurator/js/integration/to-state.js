'use strict';

/**
 * Normalised payload → the flat object state-manager carries.
 *
 * Pure. The result is handed to updateStateMultiple() in one call so a whole
 * configuration lands as a single notification and a single rebuild.
 */

import { getConstants } from '../product-constants.js';
import { interpolateValue } from '../math-utils.js';
import { mmToM, toCategory, toStateGrille } from './schema.js';

/**
 * The contract numbers rows from the top; the engine numbers them from the
 * bottom so row order follows the Y axis. This is the only place that flips.
 */
export const flipRow = (row, rows) => (rows - 1) - row;

export function toState(normalized, productType) {
  const { profile, dimensions, colors, presentation, options, locale } = normalized;
  const category = toCategory(productType);

  const C = getConstants(category, profile.material, profile.series);

  const widthM = mmToM(dimensions.widthMm);
  const heightM = mmToM(dimensions.heightMm);

  const state = {
    productCategory: category,
    locale,

    frameWidthRaw: widthM,
    frameHeightRaw: heightM,
    // Normalised 0–1 against the range the GLB is authored to deform over.
    frameWidth: interpolateValue(widthM, C.frameMinWidth, C.frameMaxWidth),
    frameHeight: interpolateValue(heightM, C.frameMinHeight, C.frameMaxHeight),

    profileMaterial: profile.material,
    profileModel: profile.series,
    profileOffset: profile.offset,

    view: presentation.view,

    ...colorsToState(colors),
    ...(productType === 'window' ? windowOptionsToState(options)
      : productType === 'door' ? doorOptionsToState(options)
        : backDoorOptionsToState(options)),
  };

  return state;
}

function colorsToState(colors) {
  if (colors.mode === 'split') {
    return {
      colorMode: 'split',
      colorExterior: colors.exteriorHex,
      colorInterior: colors.interiorHex,
      // PVC renders one colour throughout; exterior is the one on show.
      colorPVC: colors.exteriorHex,
    };
  }

  return {
    colorMode: 'uniform',
    colorExterior: colors.uniformHex,
    colorInterior: colors.uniformHex,
    colorPVC: colors.uniformHex,
  };
}

function windowOptionsToState(options) {
  const { layout } = options;
  const rows = layout.rows;

  // Payload order is top→bottom then left→right; state indexes sections in the
  // order they arrive, so index N here is the client's Nth section.
  const sections = layout.sections.map((s, index) => ({
    index,
    row: flipRow(s.row, rows),
    col: s.col,
    colSpan: s.colSpan,
    openingType: s.opening,
  }));

  return {
    // No preset produced this layout — the demo harness uses sectionLayout, the
    // API does not.
    sectionLayout: null,
    layout: {
      columns: layout.columns,
      rows: layout.rows,
      transom: layout.transom,
      mullionless: layout.mullionless,
      shape: layout.shape,
    },
    sections,
    windowHandleType: options.handleModel,
    windowHandleColor: options.handleColor,
    grille: toStateGrille(options.grille),
  };
}

function doorOptionsToState(options) {
  return {
    designType: options.designType,
    designGlassType: options.glassType,
    hasWindowFrame: options.hasWindowFrame,
    openSide: options.openSide,
    handleInside: options.handleInside,
    handleOutside: options.handleOutside,
    handleColor: options.handleColor,
    hingeType: options.hingeType,
    hasPost: options.hasPost,
    hasVent: options.hasVent,
  };
}

// The contract calls it designType for every product type; state keeps the two
// catalogues in separate fields so nothing has to know the category to read one.
function backDoorOptionsToState(options) {
  return {
    backDoorDesignType: options.designType,
    hasTransomLight: options.hasTransomLight,
    openSide: options.openSide,
    handleInside: options.handleInside,
    handleOutside: options.handleOutside,
    handleColor: options.handleColor,
    hingeType: options.hingeType,
  };
}
