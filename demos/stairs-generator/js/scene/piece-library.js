'use strict';

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { PIECES_MODEL_PATH, USE_PLACEHOLDER_PIECES } from '../settings.js';
import { PIECE_MORPH_OVERREACH, PIECE_MORPH_RANGES, PIECE_SOURCE_NAMES, PIECE_TYPES } from '../core/piece-contract.js';

export { PIECE_MORPH_OVERREACH, PIECE_MORPH_RANGES, PIECE_SOURCE_NAMES, PIECE_TYPES };

const SLAB_THICKNESS = 0.045;
// Sized as a lone centre spine, not one of a pair of edge boards. The real GLB
// overrides both; these only shape the placeholder.
const STRINGER_HEIGHT = 0.2;
const STRINGER_THICKNESS = 0.12;
const STRINGER_BASE_LENGTH = 1.0;
const IDENTITY_MATRIX = new THREE.Matrix4();

export async function loadPieceLibrary() {
  return USE_PLACEHOLDER_PIECES ? createPlaceholderPieces() : loadPiecesFromGlb(PIECES_MODEL_PATH);
}

//#region Placeholder pieces

function createPlaceholderPieces() {
  const material = new THREE.MeshStandardMaterial({ color: '#b9c2cc', roughness: 0.65, metalness: 0.0 });

  return withAliases({
    step: createSlabMesh('step', PIECE_MORPH_RANGES.step, material),
    landing: createSlabMesh('landing', PIECE_MORPH_RANGES.landing, material),
    stringer: createStringerMesh(material),
  });
}

function createSlabMesh(name, ranges, material) {
  const [minWidth, maxWidth] = ranges.width;
  const [minLength, maxLength] = ranges.length;

  const geometry = new THREE.BoxGeometry(minWidth, SLAB_THICKNESS, minLength);
  // Origin at the centre of the top face, per spec §9.4.
  geometry.translate(0, -SLAB_THICKNESS / 2, 0);

  const position = geometry.attributes.position;
  const widthDelta = [];
  const lengthDelta = [];
  const widthGrowth = (maxWidth - minWidth) / 2;
  const lengthGrowth = (maxLength - minLength) / 2;

  // Correct only because BoxGeometry defaults to 1 segment per axis, so every vertex
  // sits at +/-half-extent and never at exactly 0. Adding width/depthSegments would
  // give shared-edge vertices sign() === 0 and silently zero their delta.
  for (let index = 0; index < position.count; index += 1) {
    widthDelta.push(Math.sign(position.getX(index)) * widthGrowth, 0, 0);
    lengthDelta.push(0, 0, Math.sign(position.getZ(index)) * lengthGrowth);
  }

  geometry.morphAttributes.position = [
    new THREE.Float32BufferAttribute(widthDelta, 3),
    new THREE.Float32BufferAttribute(lengthDelta, 3),
  ];
  // glTF morph targets are deltas; match that so the real GLB behaves identically.
  geometry.morphTargetsRelative = true;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.morphTargetDictionary = { width: 0, length: 1 };
  mesh.morphTargetInfluences = [0, 0];
  return mesh;
}

function createStringerMesh(material) {
  const geometry = new THREE.BoxGeometry(STRINGER_THICKNESS, STRINGER_HEIGHT, STRINGER_BASE_LENGTH);
  // Origin at the start end, top edge of the cross-section: the solver drops the stringer
  // below the nosing line by a vertical riser + slab, so the board must hang below that
  // origin rather than straddle it. See spec §9.4.
  geometry.translate(0, -STRINGER_HEIGHT / 2, STRINGER_BASE_LENGTH / 2);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'stringer';
  return mesh;
}

//#endregion

//#region GLB pieces

async function loadPiecesFromGlb(path) {
  const gltf = await new GLTFLoader().loadAsync(path);
  const pieces = {};

  for (const type of PIECE_TYPES) {
    if (PIECE_SOURCE_NAMES[type]) continue;

    const found = gltf.scene.getObjectByName(type);
    if (!found) throw new Error(`STAIRS_DEBUG piece-library: ${path} is missing the "${type}" object`);

    found.removeFromParent();
    assertTransformsApplied(found, type);
    reanchorToContract(found, type);

    pieces[type] = found;
  }

  return withAliases(pieces);
}

// An alias shares its source's geometry by reference, and reanchorToContract translates
// geometry in place — so cloning has to happen after the source is anchored, never during
// the loop, or the shared buffer gets shifted twice.
function withAliases(pieces) {
  for (const [type, source] of Object.entries(PIECE_SOURCE_NAMES)) {
    pieces[type] = pieces[source].clone();
    pieces[type].name = type;
  }

  return pieces;
}

// The controller overwrites each instance's TRS, so a transform baked onto the node would
// vanish silently and misorient the piece. Spec §9.4 requires applied transforms — and a
// multi-primitive piece arrives as a Group, so its children have to be clean too.
function assertTransformsApplied(object, type) {
  object.traverse((node) => {
    node.updateMatrix();
    if (node.matrix.equals(IDENTITY_MATRIX)) return;

    throw new Error(
      `STAIRS_DEBUG piece-library: "${type}" carries a node transform on "${node.name}"; apply all transforms before export`,
    );
  });
}

// Contract origins (docs/model-brief.md): slabs hang below the centre of their top face,
// the stringer hangs below its start end. The shipped GLB centres both instead, which would
// float every tread half a slab high and start every stringer half a metre behind its
// flight. Deriving the shift from the bounds keeps this idempotent — a corrected re-export
// shifts by zero rather than double.
function reanchorToContract(object, type) {
  const bounds = baseMeshBounds(object);
  const offsetY = -bounds.max.y;
  const offsetZ = type === 'stringer' ? -bounds.min.z : 0;

  if (offsetY === 0 && offsetZ === 0) return;

  const moved = new Set();

  object.traverse((child) => {
    if (!child.isMesh || moved.has(child.geometry)) return;

    child.geometry.translate(0, offsetY, offsetZ);
    moved.add(child.geometry);
  });
}

// Base positions only, never Box3.setFromObject: that expands by the morph targets, so a
// future shapekey touching Y would silently drag the anchor off the base mesh.
function baseMeshBounds(object) {
  const bounds = new THREE.Box3().makeEmpty();
  const childBounds = new THREE.Box3();

  object.traverse((child) => {
    if (!child.isMesh) return;
    bounds.union(childBounds.setFromBufferAttribute(child.geometry.attributes.position));
  });

  return bounds;
}

//#endregion
