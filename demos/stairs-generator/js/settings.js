'use strict';

//! *************** 3D SCENE ***************

export const BACKGROUND_COLOR = '#f2f2f2';
export const TONE_MAPPING_EXPOSURE = 1.0;
export const RENDER_MAX_PIXEL_RATIO = 1.5;

// Environment map only — no lights, no shadows. See spec §8.5.
export const ENVIRONMENT_MAP = './src/environment/unfinished_office_500.hdr';
export const ENVIRONMENT_MAP_INTENSITY = 1.0;

export const CAMERA_FOV = 45;
export const CAMERA_FIT_PADDING = 1.25;
export const CAMERA_VIEW_DIRECTION = [1, 0.55, 1.4];

// Quiet period after the canvas stops resizing before the camera re-fits. Dragging a
// window edge or animating the mobile drawer open would otherwise run the fit's
// Box3.setFromObject on every frame.
export const CAMERA_REFIT_DEBOUNCE_MS = 120;

//! *************** MODEL ***************

export const PIECES_MODEL_PATH = './src/model/step.glb';

// Escape hatch: box geometry matching the same contract, for working without the GLB.
export const USE_PLACEHOLDER_PIECES = false;

//! *************** STAIRS GEOMETRY ***************

// Pushes the stringer's top edge below the flush position, reopening daylight between the
// beam and the landing's underside at one millimetre per millimetre. It is the only knob on
// that gap now that the drop is a slab; at 0 the beam sits flush, which is the design.
export const STRINGER_LANDING_CLEARANCE = 0;

// Measured off the GLB's landing slab. The stringer drop and the landing bar's height are
// both derived from it, so the beam clears the slab by the same margin at every landing.
export const LANDING_SLAB_THICKNESS = 0.07;

// The shortest leg the landing-depth clamp guarantees — the quarter turn's first leg,
// landingDepth/2 - stepGoing. A landing deepens past the stair width rather than let that
// leg shrink below this, which at a 0.8 m stair and a 0.48 going would otherwise fold it
// back behind its own start. A reversal's two legs (stepWidth and stepGoing) come straight
// from the schema instead and never touch landingDepth, so this constant doesn't bound them.
export const LANDING_BAR_MIN_LEG = 0.1;

// How far the step's bracket reaches below the tread's underside — measured off the GLB
// *after* piece-library re-anchors the group, which shifts everything down 0.035. Reading
// the raw accessor gives 0.1114 and is wrong by exactly that shift.
//
// It bridges half a riser: the bracket hangs at the tread's centre, and the nosing line the
// stringer follows is half a riser below the tread top there. It out-reaches that below
// h = 0.2928, so the tip embeds in the beam rather than falling short of it.
export const STEP_BRACKET_REACH = 0.1464;

// Ceiling on the tread drop, as a fraction of one riser. **Dormant**: with the beam a slab
// under the floor the uncapped drop peaks at 14 mm against a 213 mm cap, so this never binds.
// Kept as a guard — lower the beam again and the drop is paid entirely by a flight's first
// riser, which is the step up off a landing, and past 1.0 that step inverts into the slab.
export const STEP_BRACKET_DROP_RISER_LIMIT = 2 / 3;

// The stringer's own square section, measured off the GLB (0.08 x 0.08). The solver needs it
// to overlap bar joints: a butt joint between a bar and a raked beam leaves a wedge open,
// because the beam's end face is perpendicular to its own axis rather than vertical.
export const STRINGER_SECTION = 0.08;

