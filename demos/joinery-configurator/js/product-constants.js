/**
 * product-constants.js
 * Per-category / per-material / per-model constants.
 * Single source of truth for all dimension ranges, geometry offsets, and anim params.
 *
 * Usage:
 *   import { getConstants } from './product-constants.js';
 *   const C = getConstants('windows', 'alum', '70');
 *   const C = getConstants('doors',   'pvc',  '120');
 */

// ─── Constants table ──────────────────────────────────────────────────────────


// DONT TOUCH MIN MAX NEVER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const CONSTANTS = {
  // DONT TOUCH MIN MAX NEVER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  windows: {
    alum: {
      '70': {
        tiltAngle: Math.PI * 0.03,
        tiltOnlyAngle: Math.PI * 0.25,
        tiltTurnHingeAngleMultiplier: 1.25,
        turnAngle: Math.PI * 0.45,
        animDuration: 600,
        // DONT TOUCH MIN MAX NEVER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        // frameMinWidth: 0.42,
        // frameMaxWidth: 3.48,
        // frameMinHeight: 0.269,
        // frameMaxHeight: 2.82,
        // DONT TOUCH MIN MAX NEVER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        frameMinWidth: 0.4,
        frameMaxWidth: 3.46,
        frameMinHeight: 0.25,
        frameMaxHeight: 2.8,
        // DONT TOUCH MIN MAX NEVER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        windowMinWidth: 0.366,
        windowMaxWidth: 3.42,
        windowMinHeight: 0.216,
        windowMaxHeight: 2.77,
        windowSlotExpand: 0.001,
        // DONT TOUCH MIN MAX NEVER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        fixMixWindowMinWidth: 0.345,
        fixMixWindowMaxWidth: 3.4,
        fixMixWindowMinHeight: 0.192,
        fixMixWindowMaxHeight: 2.74,
        windowFixMixSlotExpand: -0.015,
        windowFixMixSlotExpandY: -0.007,
        // DONT TOUCH MIN MAX NEVER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        windowOffsetH: 0.0,
        windowOffsetBottomY: 0.00,
        fixedPanelBottomOffset: 0,
        fixWindowOffsetH: 0.0,
        fixWindowOffsetBottomY: 0.00,

        mullionMinHeight: 0.205,
        mullionMaxHeight: 2.75,

        mullionOffsetH: 0,
        mullionOffsetBottomY: 0,

        frameEdgeWidth: 0.020,
        frameEdgeHeight: 0.02,

        mullionWidth: 0.015,
        transomHeight: 0.008,
        // Height of the glass light above the transom bar, when
        // layout.transom is set. Independent of column count.
        transomLightHeight: 0.36,
        sashOverlap: 0.0,

        hingeEdgeOffset: 0.008,
        tiltOnlyHingeEdgeOffset: 0.008,
        hingeYOffset: -0.02,

        handleInset: 0.025,
        tiltOnlyHandleYOffset: 0.015,

        // ── Pivot offsets (tune per material/model) ──────────────────────────
        pivotZOffset: 0,   // shift along Z toward viewer
        pivotXTilt: 0,   // tilt axis X nudge
        pivotYTilt: 0,   // tilt axis Y from slot bottom
        pivotXTurn: 0,   // turn axis inset from hinge edge
        pivotYTurn: 0,   // turn axis Y from slot bottom
      },
    },

    pvc: {
      '70': {
        tiltAngle: Math.PI * 0.03,
        tiltOnlyAngle: Math.PI * 0.25,
        tiltTurnHingeAngleMultiplier: 1.25,
        turnAngle: Math.PI * 0.45,
        animDuration: 600,

        frameMinWidth: 0.4,
        frameMaxWidth: 3.5,
        frameMinHeight: 0.25,
        frameMaxHeight: 2.8,

        windowMinWidth: 0.326,
        windowMaxWidth: 3.43,
        windowMinHeight: 0.176,
        windowMaxHeight: 2.73,
        windowSlotExpand: 0.004,
        // DONT TOUCH MIN MAX NEVER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        fixMixWindowMinWidth: 0.312,
        fixMixWindowMaxWidth: 3.41,
        fixMixWindowMinHeight: 0.16,
        fixMixWindowMaxHeight: 2.71,
        windowFixMixSlotExpand: -0.01,
        windowFixMixSlotExpandY: -0.014,
        // DONT TOUCH MIN MAX NEVER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        windowOffsetH: 0.01,
        windowOffsetBottomY: -0.010,
        fixedPanelBottomOffset: 0.007,

        mullionMinHeight: 0.21,
        mullionMaxHeight: 2.76,

        mullionOffsetH: 0.05,
        mullionOffsetBottomY: 0.0,

        frameEdgeWidth: 0.04,
        frameEdgeHeight: 0.035,
        mullionWidth: 0.02,
        transomHeight: 0.017,
        // Height of the glass light above the transom bar, when
        // layout.transom is set. Independent of column count.
        transomLightHeight: 0.36,
        sashOverlap: 0.0,
        hingeEdgeOffset: 0.01,
        tiltOnlyHingeEdgeOffset: 0.004,
        hingeYOffset: 0,
        handleInset: 0.023,
        tiltOnlyHandleYOffset: 0.015,

        // ── Pivot offsets (tune per material/model) ──────────────────────────
        pivotZOffset: 0,
        pivotXTilt: 0,
        pivotYTilt: 0,
        pivotXTurn: 0,
        pivotYTurn: 0,
      },

      '120': {
        tiltAngle: Math.PI * 0.03,
        tiltOnlyAngle: Math.PI * 0.25,
        tiltTurnHingeAngleMultiplier: 1.25,
        turnAngle: Math.PI * 0.45,
        animDuration: 600,

        frameMinWidth: 0.4,
        frameMaxWidth: 3.5,
        frameMinHeight: 0.25,
        frameMaxHeight: 2.8,

        windowMinWidth: 0.322,
        windowMaxWidth: 3.42,
        windowMinHeight: 0.174,
        windowMaxHeight: 2.72,
        windowSlotExpand: 0.001,
        // DONT TOUCH MIN MAX NEVER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        fixWindowMinWidth: 0.4,
        fixWindowMaxWidth: 3.5,
        fixWindowMinHeight: 0.25,
        fixWindowMaxHeight: 2.8,
        // DONT TOUCH MIN MAX NEVER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        fixMixWindowMinWidth: 0.312,
        fixMixWindowMaxWidth: 3.41,
        fixMixWindowMinHeight: 0.162,
        fixMixWindowMaxHeight: 2.71,
        windowFixMixSlotExpand: -0.018,
        windowFixMixSlotExpandY: -0.016,
        // DONT TOUCH MIN MAX NEVER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        windowOffsetH: 0.01,
        windowOffsetBottomY: -0.010,
        fixedPanelBottomOffset: 0.007,

        mullionMinHeight: 0.21,
        mullionMaxHeight: 2.76,

        mullionOffsetH: 0.05,
        mullionOffsetBottomY: 0.00,

        frameEdgeWidth: 0.035,
        frameEdgeHeight: 0.037,
        mullionWidth: 0.02,
        transomHeight: 0.02,
        // Height of the glass light above the transom bar, when
        // layout.transom is set. Independent of column count.
        transomLightHeight: 0.36,
        sashOverlap: 0.0,
        hingeEdgeOffset: 0.01,
        tiltOnlyHingeEdgeOffset: 0.004,
        hingeYOffset: 0,
        handleInset: 0.023,
        tiltOnlyHandleYOffset: 0.015,

        // ── Pivot offsets (tune per material/model) ──────────────────────────
        pivotZOffset: 0,
        pivotXTilt: 0,
        pivotYTilt: 0,
        pivotXTurn: 0,
        pivotYTurn: 0,
      },
    },
  },

  doors: {
    alum: {
      '70': {
        tiltAngle: 0,
        turnAngle: Math.PI * 0.45,
        animDuration: 600,

        frameMinWidth: 0.818,
        frameMaxWidth: 1.22,
        frameMinHeight: 1.8,
        frameMaxHeight: 2.6,

        doorMinWidth: 0.75,
        doorMaxWidth: 1.15,
        doorMinHeight: 1.74,
        doorMaxHeight: 2.54,
        doorFrameWidth: 0.15,

        mullionMinHeight: 0,
        mullionMaxHeight: 0,

        frameEdgeWidth: 0.04,
        frameEdgeHeight: 0.04,
        mullionWidth: 0.02,
        transomHeight: 0.02,
        sashOverlap: 0.0,
        hingeEdgeOffset: 0.02,
        handleInset: 0.023,
        hingeFrameOffset: 0.045,
        hingeFrame2Offset: 0.043,
        hingeCount: 3,
        hingeBottomOffset: 0.2,
        hingeTopOffset: 0.2,
        hingeMiddleFromTopOffset: 0.16,
        // Pin axis offset from the hinge model's origin (local Z). The leaf has
        // to swing around the pin — the designer hinge's origin sits in front of
        // it, so without this the moving leaf sweeps through the rod.
        hingePinZ: -0.0044,   // designer (hingeType 1)
        hingePin2Z: 0,        // simple (hingeType 2) — origin is already on the pin
        handleOutsideXOffset: 0.02,
        handleOutsideModelXOffsets: { 1: -0.1, 2: -0.1, 3: -0.1 },
        handleInsideXOffset: -0.04,
        handleOutsideZOffset: -0.01,
        handleInsideZOffset: 0.01,

        // ── Pivot offsets (tune per material/model) ──────────────────────────
        pivotZOffset: 0,
        pivotXTilt: 0,
        pivotYTilt: 0,
        pivotXTurn: 0,
        pivotYTurn: 0,
      },
    },

    pvc: {
      '70': {
        tiltAngle: 0,
        turnAngle: Math.PI * 0.45,
        animDuration: 600,

        frameMinWidth: 0.8,
        frameMaxWidth: 1.2,
        frameMinHeight: 1.8,
        frameMaxHeight: 2.6,

        doorMinWidth: 0.755,
        doorMaxWidth: 1.15,
        doorMinHeight: 1.78,
        doorMaxHeight: 2.58,
        doorFrameWidth: 0.15,

        mullionMinHeight: 0,
        mullionMaxHeight: 0,

        frameEdgeWidth: 0.04,
        frameEdgeHeight: 0.04,
        mullionWidth: 0.02,
        transomHeight: 0.02,
        sashOverlap: 0.0,
        hingeEdgeOffset: 0.01,
        handleInset: 0.023,
        hingeFrameOffset: 0.012,
        hingeFrame2Offset: 0.01,
        hingeCount: 3,
        hingeBottomOffset: 0.18,
        hingeTopOffset: 0.2,
        // PVC ships one hinge model, so both hinge types share the pin offset.
        hingePinZ: -0.0062,
        hingePin2Z: -0.0062,
        handleOutsideXOffset: 0,
        handleOutsideModelXOffsets: { 1: -0.075, 2: -0.075, 3: -0.075 },
        handleInsideXOffset: 0.01,
        handleOutsideZOffset: 0,
        handleInsideZOffset: 0,

        // ── Pivot offsets (tune per material/model) ──────────────────────────
        pivotZOffset: 0,
        pivotXTilt: 0,
        pivotYTilt: 0,
        pivotXTurn: 0,
        pivotYTurn: 0,
      },

      '120': {
        tiltAngle: 0,
        turnAngle: Math.PI * 0.45,
        animDuration: 600,

        frameMinWidth: 0.802,
        frameMaxWidth: 1.2,
        frameMinHeight: 1.8,
        frameMaxHeight: 2.6,

        doorMinWidth: 0.753,
        doorMaxWidth: 1.15,
        doorMinHeight: 1.78,
        doorMaxHeight: 2.57,
        doorFrameWidth: 0.15,

        mullionMinHeight: 0,
        mullionMaxHeight: 0,

        frameEdgeWidth: 0.04,
        frameEdgeHeight: 0.04,
        mullionWidth: 0.02,
        transomHeight: 0.02,
        sashOverlap: 0.0,
        hingeEdgeOffset: 0.01,
        handleInset: 0.023,
        hingeFrameOffset: 0.015,
        hingeFrame2Offset: 0.01,
        hingeCount: 3,
        hingeBottomOffset: 0.18,
        hingeTopOffset: 0.2,
        // PVC ships one hinge model, so both hinge types share the pin offset.
        hingePinZ: 0,
        hingePin2Z: 0,
        handleOutsideXOffset: 0,
        handleOutsideModelXOffsets: { 1: -0.08, 2: -0.08, 3: -0.06 },
        handleInsideXOffset: 0.01,
        handleOutsideZOffset: 0,
        handleInsideZOffset: 0,

        // ── Pivot offsets (tune per material/model) ──────────────────────────
        pivotZOffset: 0,
        pivotXTilt: 0,
        pivotYTilt: 0,
        pivotXTurn: 0,
        pivotYTurn: 0,
      },
    },
  },

  // Frame min/max are measured off door_demo_back.glb's frame morph targets —
  // the frame is the outer product dimension. The leaf deforms by the same
  // delta over the same interval, so one normalised value drives both.
  //
  // Hinge offsets are measured, not seeded: hingeFrameOffset is derived from
  // each hinge node's authored translation via placeHinges' own formula
  // (x = -frameWidthRaw/2 + frameOffset), and hingePinZ from the move node's
  // local z centre — that is where the rod runs, and the leaf has to swing
  // around it rather than through it.
  backDoors: {
    alum: {
      '70': {
        turnAngle: Math.PI * 0.45,
        animDuration: 600,

        frameMinWidth: 0.800,
        frameMaxWidth: 1.300,
        frameMinHeight: 1.804,
        frameMaxHeight: 2.607,

        // Height the bovenlicht frame adds above the door frame. Differs per
        // material, which is why it lives here and not in the contract prose.
        transomExtraHeight: 0.520,

        doorFrameWidth: 0.15,

        hingeCount: 3,
        hingeBottomOffset: 0.2,
        // From the authored hinge at y=1.6512 against a 1.804 frame.
        hingeTopOffset: 0.1528,
        hingeMiddleFromTopOffset: 0.16,
        // Authored hinge x=-0.3472, frame half-width 0.400.
        hingeFrameOffset: 0.0528,
        // No alum_door_back_hinge_2_* exists, so the `2` variants are
        // unreachable — kept equal so a stray hingeType 2 cannot NaN a
        // transform if it ever bypasses validation.
        hingeFrame2Offset: 0.0528,
        hingePinZ: -0.0049,
        hingePin2Z: -0.0049,

        // Seeded from the doors block — unmeasurable until the handle nodes ship.
        handleOutsideXOffset: 0.02,
        handleOutsideModelXOffsets: { 1: -0.1, 2: -0.1, 3: -0.1 },
        handleInsideXOffset: -0.04,
        handleOutsideZOffset: -0.01,
        handleInsideZOffset: 0.01,
      },
    },

    pvc: {
      '70': {
        turnAngle: Math.PI * 0.45,
        animDuration: 600,

        frameMinWidth: 0.799,
        frameMaxWidth: 1.299,
        frameMinHeight: 1.800,
        frameMaxHeight: 2.598,

        transomExtraHeight: 0.442,

        doorFrameWidth: 0.15,

        hingeCount: 3,
        hingeBottomOffset: 0.18,
        // From the authored hinge at y=1.6070 against a 1.800 frame.
        hingeTopOffset: 0.193,
        hingeMiddleFromTopOffset: 0.16,
        // Authored hinge x=-0.3690, frame half-width 0.3997.
        hingeFrameOffset: 0.0307,
        hingeFrame2Offset: 0.0307,
        hingePinZ: -0.0066,
        hingePin2Z: -0.0066,

        handleOutsideXOffset: 0,
        handleOutsideModelXOffsets: { 1: -0.075, 2: -0.075, 3: -0.075 },
        handleInsideXOffset: 0.01,
        handleOutsideZOffset: 0,
        handleInsideZOffset: 0,
      },

      '120': {
        turnAngle: Math.PI * 0.45,
        animDuration: 600,

        frameMinWidth: 0.799,
        frameMaxWidth: 1.299,
        frameMinHeight: 1.799,
        frameMaxHeight: 2.598,

        transomExtraHeight: 0.497,

        doorFrameWidth: 0.15,

        hingeCount: 3,
        hingeBottomOffset: 0.18,
        // From the authored hinge at y=1.6070 against a 1.799 frame.
        hingeTopOffset: 0.192,
        hingeMiddleFromTopOffset: 0.16,
        // Authored hinge x=-0.3826, frame half-width 0.3997.
        hingeFrameOffset: 0.0171,
        hingeFrame2Offset: 0.0171,
        // Same hinge geometry as pvc 70 — 154/314 verts, identical local z.
        hingePinZ: -0.0066,
        hingePin2Z: -0.0066,

        handleOutsideXOffset: 0,
        handleOutsideModelXOffsets: { 1: -0.08, 2: -0.08, 3: -0.06 },
        handleInsideXOffset: 0.01,
        handleOutsideZOffset: 0,
        handleInsideZOffset: 0,
      },
    },
  },
};

// ─── Resolver ─────────────────────────────────────────────────────────────────

/**
 * @param {string} category  — 'windows' | 'doors' | 'backDoors'
 * @param {string} material  — 'alum' | 'pvc'
 * @param {string} model     — '70' | '120'
 * @returns {object}
 */
export function getConstants(category, material, model) {
  const byCategory = CONSTANTS[category];
  if (!byCategory) {
    console.warn(`[Constants] Unknown category "${category}", falling back to windows/alum/70`);
    return CONSTANTS.windows.alum['70'];
  }

  const byMaterial = byCategory[material];
  if (!byMaterial) {
    console.warn(`[Constants] Unknown material "${material}" for "${category}", falling back to alum/70`);
    return Object.values(byCategory)[0]['70'] ?? Object.values(Object.values(byCategory)[0])[0];
  }

  // Alum currently only ships with model 70 — ignore the model value.
  const resolvedModel = material === 'alum' ? '70' : model;

  const constants = byMaterial[resolvedModel];
  if (!constants) {
    console.warn(`[Constants] Unknown model "${resolvedModel}" for "${category}/${material}", falling back to first available`);
    return Object.values(byMaterial)[0];
  }

  return constants;
}
