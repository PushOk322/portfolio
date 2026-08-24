'use strict';

/**
 * State → normalised payload, the inverse of to-state.js.
 *
 * getConfiguration() reads through this rather than replaying a cached payload,
 * so what the client gets back is whatever is genuinely on screen even if
 * something changed state without going through applyConfiguration().
 */

import { SCHEMA_VERSION, mToMm, toProductType, fromStateGrille } from './schema.js';
import { flipRow } from './to-state.js';

export function fromState(state) {
  const productType = toProductType(state.productCategory);

  return {
    schemaVersion: SCHEMA_VERSION,
    locale: state.locale,
    dimensions: {
      widthMm: mToMm(state.frameWidthRaw),
      heightMm: mToMm(state.frameHeightRaw),
    },
    profile: {
      material: state.profileMaterial,
      series: state.profileModel,
      offset: state.profileOffset,
    },
    colors: colorsFromState(state),
    presentation: { view: state.view },
    options: productType === 'window' ? windowOptionsFromState(state)
      : productType === 'door' ? doorOptionsFromState(state)
        : backDoorOptionsFromState(state),
  };
}

function colorsFromState(state) {
  if (state.colorMode === 'split') {
    return {
      mode: 'split',
      exteriorHex: state.colorExterior,
      interiorHex: state.colorInterior,
    };
  }

  return { mode: 'uniform', uniformHex: state.colorPVC };
}

function windowOptionsFromState(state) {
  const { layout, sections } = state;
  const rows = layout.rows;

  return {
    layout: {
      columns: layout.columns,
      rows: layout.rows,
      transom: layout.transom,
      mullionless: layout.mullionless,
      shape: layout.shape,
      // Contract reading order: top→bottom, then left→right.
      sections: sections
        .map(s => ({
          row: flipRow(s.row, rows),
          col: s.col,
          colSpan: s.colSpan ?? 1,
          opening: s.openingType,
        }))
        .sort((a, b) => a.row - b.row || a.col - b.col),
    },
    handleModel: state.windowHandleType,
    handleColor: state.windowHandleColor,
    grille: fromStateGrille(state.grille),
  };
}

function doorOptionsFromState(state) {
  return {
    designType: state.designType,
    glassType: state.designGlassType,
    hasWindowFrame: state.hasWindowFrame,
    openSide: state.openSide,
    handleInside: state.handleInside,
    handleOutside: state.handleOutside,
    handleColor: state.handleColor,
    hingeType: state.hingeType,
    hasPost: state.hasPost,
    hasVent: state.hasVent,
  };
}

function backDoorOptionsFromState(state) {
  return {
    designType: state.backDoorDesignType,
    hasTransomLight: state.hasTransomLight,
    openSide: state.openSide,
    handleInside: state.handleInside,
    handleOutside: state.handleOutside,
    handleColor: state.handleColor,
    hingeType: state.hingeType,
  };
}
