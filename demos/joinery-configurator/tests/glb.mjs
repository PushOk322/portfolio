import fs from 'node:fs';

const GLB_JSON_CHUNK = 0x4e4f534a;
const GLB_BIN_CHUNK = 0x004e4942;

/** Parses a .glb container into its JSON and BIN chunks. */
export function readGlb(file) {
  const buf = fs.readFileSync(file);
  const total = buf.readUInt32LE(8);
  let json = null;
  let bin = null;

  for (let off = 12; off < total;) {
    const length = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    const chunk = buf.subarray(off + 8, off + 8 + length);
    if (type === GLB_JSON_CHUNK) json = JSON.parse(chunk.toString('utf8'));
    if (type === GLB_BIN_CHUNK) bin = chunk;
    off += 8 + length;
  }
  if (!json) throw new Error(`no JSON chunk in ${file}`);
  return { json, bin };
}

/** Axis-aligned bounds of a node's mesh, from the accessors' own min/max. */
export function nodeBounds(gltf, nodeName) {
  const node = gltf.nodes.find(n => n.name === nodeName);
  if (!node || node.mesh === undefined) return null;

  const mins = [];
  const maxs = [];
  for (const prim of gltf.meshes[node.mesh].primitives) {
    const accessor = gltf.accessors[prim.attributes.POSITION];
    mins.push(accessor.min);
    maxs.push(accessor.max);
  }

  return {
    min: [0, 1, 2].map(k => Math.min(...mins.map(m => m[k]))),
    max: [0, 1, 2].map(k => Math.max(...maxs.map(m => m[k]))),
  };
}

/** Morph target names declared on a node's mesh. */
export function morphNames(gltf, nodeName) {
  const node = gltf.nodes.find(n => n.name === nodeName);
  if (!node || node.mesh === undefined) return [];
  return gltf.meshes[node.mesh].extras?.targetNames ?? [];
}

/**
 * Largest delta a node's width/height morph applies, along that morph's own
 * axis. Read from the target accessor's declared bounds rather than the buffer.
 *
 * `kind` is matched as a name suffix because pvc_120's window pair carries each
 * other's morph names — the suffix is the only part that stays true.
 */
export function morphDelta(gltf, nodeName, kind) {
  const node = gltf.nodes.find(n => n.name === nodeName);
  if (!node || node.mesh === undefined) return null;

  const mesh = gltf.meshes[node.mesh];
  const index = (mesh.extras?.targetNames ?? []).findIndex(n => n.endsWith(kind));
  if (index < 0) return null;

  const axis = kind === 'height' ? 1 : 0;
  return Math.max(...mesh.primitives.map(
    prim => gltf.accessors[prim.targets[index].POSITION].max[axis],
  ));
}
