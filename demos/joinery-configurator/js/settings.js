'use strict';

export const GUI_MODE_UI = false;

export const DEFAULT_LANGUAGE = "NL";
export const IS_PRICE_SIMPLE = false;


//! ***************  3D SCENE SETTINGS ***************

export const GUI_MODE_LIGHTING = false;
export const DEV_MODE_HELPERS = false;

export const MODEL_CENTER_POSITION = 0;
export const START_CAMERA_POSITION = [2.5, 1.2, 4.1];
export const ADD_FLOOR = false;

export const CONTROL_TARGET_POSITION_Y = 1.2;
export const CONTROLS_ENABLE_PAN = true;
export const CONTROLS_FIX_VERTICAL_PAN = false; // фіксує панування по вертикалі

export const BACKGROUND_COLOR = '#e3e3e3'; // 0xffffff (default);
export const SHADOW_TRANSPARENCY = 0;
export const TONE_MAPPING_EXPOSURE = 0.9; // 1.0 (default)
// None | Linear | Reinhard | Cineon | ACESFilmic | AgX | Neutral
export const TONE_MAPPING_TYPE = 'Linear';

export const SHADOWS_ENABLED = true;
// Basic | PCF | PCFSoft | VSM.
// three r183 deprecated PCFSoft — it warns and silently falls back to PCF.
export const SHADOW_MAP_TYPE = 'PCFSoft';

export const ENVIRONMENT_MAP = './src/environment/studio_kontrast_02_1k.hdr'; // neutral.hdr (default)
// export const ENVIRONMENT_MAP = './src/environment/neutral.hdr'; // neutral.hdr (default)
export const ENVIRONMENT_MAP_INTENSITY = 0.7;  //  1.0  (default)
export const ENVIRONMENT_MAP_FLIP_X = false;   // false (default)
export const ENVIRONMENT_MAP_ROTATEBLE = true; // false (default)
export const ENVIRONMENT_MAP_ANGLE = 72;        //   0   (default)

export const ADD_DIRLIGHT = true;
export const DIRLIGHT_INTENSITY = 1.4;
export const DIRLIGHT_INTENSITY_ANDROID = 1.9;
export const DIRLIGHT_COLOR = '#ffffff';

export const DIRLIGHT_POS_X = 6.7;
export const DIRLIGHT_POS_Y = 16;
export const DIRLIGHT_POS_Z = 12;

// The point the light aims at. Keep it near the middle of the model: the shadow
// frustum is centred on the light->target axis, so a target far off the model
// pushes the model out of the (small) frustum and the shadow disappears.
export const DIRLIGHT_TARGET_X = 0;
export const DIRLIGHT_TARGET_Y = 1.2;
export const DIRLIGHT_TARGET_Z = 0;

export const DIRLIGHT_CAST_SHADOW = true;
export const DIRLIGHT_SHADOW_BIAS = 0.00001;
export const DIRLIGHT_SHADOW_NORMAL_BIAS = 0.021;
export const DIRLIGHT_SHADOW_RADIUS = 7; // blur width, in shadow-map texels
export const DIRLIGHT_SHADOW_MAP_SIZE = 2048; // halved on low-performance devices

// When true, the shadow frustum is refitted to the loaded model's bounding box
// and the three values below are ignored. Off by default: a bbox-sized frustum
// spreads the shadow map so thin over a single window/door that the shadow
// washes out, and it silently overwrites whatever you set here or in the GUI.
export const DIRLIGHT_SHADOW_AUTOFIT = false;

export const DIRLIGHT_SHADOW_CAMERA_SIZE = 1; // half-width of the shadow frustum (left/right/top/bottom)
export const DIRLIGHT_SHADOW_CAMERA_NEAR = 0.1;
export const DIRLIGHT_SHADOW_CAMERA_FAR = 100;

export const ADD_POINTLIGHT = false; // false (default)
export const POINTLIGHT_INTENSITY = 0;
export const POINTLIGHT_COLOR = '#fff2e9';

export const POINTLIGHT_1_POS_X = 0;
export const POINTLIGHT_1_POS_Y = 1.1;
export const POINTLIGHT_1_POS_Z = 2;
export const POINTLIGHT_2_POS_X = 0;
export const POINTLIGHT_2_POS_Y = 0;
export const POINTLIGHT_2_POS_Z = 0;

export const POINTLIGHT_CAST_SHADOW = true;
export const POINTLIGHT_SHADOW_BIAS = 0;
export const POINTLIGHT_SHADOW_NORMAL_BIAS = 0;
export const POINTLIGHT_SHADOW_RADIUS = 4;
export const POINTLIGHT_SHADOW_MAP_SIZE = 2048; // halved on low-performance devices

export const ADD_AMBIENTLIGHT = false; // false (default)
export const AMBIENTLIGHT_COLOR = '#404040';
export const AMBIENTLIGHT_INTENSITY = 1;
export const AMBIENTLIGHT_INTENSITY_ANDROID = 1;

export const RENDER_SCALE = 1;

//! ***************  IDLE-BOOST ANTIALIASING ***************
// While the camera is orbiting/dragging we render cheap (low pixel ratio) —
// motion hides the jaggies. The moment motion stops we render ONE crisp,
// supersampled frame (idle ratio can exceed devicePixelRatio = true SSAA).
export const IDLE_RENDER_BOOST = false;
// Pixel ratio while interacting. Clamped to devicePixelRatio (no point
// supersampling a frame that's moving). 1 = native, 1.5 = slight AA.
export const INTERACTIVE_PIXEL_RATIO = 1.5;
// Pixel ratio for the settled frame. NOT clamped to devicePixelRatio, so on a
// 1x monitor 2 = 2x2 supersampling. Higher = crisper but heavier one-off frame.
export const IDLE_PIXEL_RATIO = 2;

//! ***************  POST-PROCESSING ANTIALIASING ***************
// EffectComposer pipeline: RenderPass -> OutputPass (tonemap+sRGB) -> AA pass.
export const ENABLE_POST_PROCESSING = true;

// 'smaa' - pattern-based edge reconstruction. Keeps fine detail sharp. (default)
// 'fxaa' - cheap luma blur. Smooths edges AND real detail -> soft/plastic look.
// 'none' - rely on the MSAA render target alone (sharpest, geometry edges only).
export const ANTIALIAS_MODE = 'smaa';

// WebGL2 MSAA samples on the composer's render target (0 = off). This is the
// sharpness-preserving AA: it resolves geometry edges without blurring interior
// pixels at all. Higher = less laddering for zero softening. Driver clamps to
// its max (usually 8). Adding a composer otherwise loses `antialias: true`.
export const COMPOSER_MSAA_SAMPLES = 16;

//! ***************  PROJECT SETTINGS ***************

export const ENABLE_ASSEMBLY_ANIMATION = false;
