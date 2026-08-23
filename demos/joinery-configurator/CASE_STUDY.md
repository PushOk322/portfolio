# Joinery Configurator

*Real-time 3D configurator for a joinery manufacturer — seven product families from one config object.*

**Tech:** Three.js · vanilla ES modules · esbuild · WebXR / model-viewer · morph targets · node:test

---

## What it is

A browser configurator for a windows-and-doors manufacturer. A customer picks a product
family — window, interior door, front door, garden door, sliding door, sectional garage
door, roller shutter — then sizes it and chooses profile, glazing, hardware and finish,
seeing the result in 3D as they go. It embeds into the manufacturer's own site as a
single-product bundle, and on a phone it places the configured product in the room in AR.

I wrote all of it: 100 of 100 commits.

## The hard part

Seven product families with overlapping-but-not-identical option sets. A sliding door
and a roller shutter share a profile catalogue and nothing else. The obvious approach —
one controller per product — is what the previous generation of this codebase did, and I
had seen where that ends: an earlier project has two 12,700-line files that are forks of
each other, so every fix has to be made twice.

Geometry was the second problem. Sizes are continuous, so products are driven by morph
targets rather than swapped meshes — 486 of them in the door model alone. That buys
smooth resizing and costs you texture mapping: as a frame morphs from 900 mm to 2400 mm,
a UV-mapped wood grain stretches with it, and stretched grain on a product someone is
about to spend four figures on looks like exactly what it is.

## How I solved it

Products became data. One `CONFIGURATOR_CONFIG` declares shared pools — profiles,
offsets, glazing, hardware, finishes — and each family references them by id. Adding an
eighth family is an entry in an object, not a new controller.

For the stretching, materials carry their projection axis in the name (`_X`, `_Y`, `_Z`)
and `morphSystem.js` injects a world-space planar UV into the vertex shader through
`onBeforeCompile`, replacing the mesh's own UVs. Grain is then anchored in world space:
the frame grows, the texture stays put. The tradeoff is that materials are addressed by
name, so a rename in Blender becomes a runtime break rather than a compile error — which
is why the model has contract tests around it.

## What I'd do differently

The config object is 500 lines and doing two jobs: describing what options exist, and
describing how they constrain each other. Those should be separate. A rule like "roller
shutters have no glazing" is currently expressed by omission, which is invisible until
something renders wrong.

I would also fix the texture-name coupling. `_X`/`_Y`/`_Z` suffixes are a clever trick
I would have to explain to whoever inherits this. A material extension, or a naming
manifest checked at load time, costs an hour and removes a whole category of silent
failure.

TODO(pasha): was the seven-family scope known up front, or did it grow? If the config
object was a response to the third family arriving late, that is a better story than
"I designed it that way".
