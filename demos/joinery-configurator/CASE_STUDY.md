# Joinery Configurator

*Seven product families driven by one config object, in real-time 3D.*

**Tech:** Three.js · vanilla ES modules · esbuild · WebXR · morph targets · node:test

---

## What it is

A browser configurator for a windows-and-doors manufacturer: pick a product family,
size it, choose profile, glazing, hardware and finish, and watch it change in 3D. It
embeds into the client's own site, and on a phone it places the result in the room in AR.

All 100 commits are mine.

## The hard part

Seven families with overlapping-but-not-identical options — a sliding door and a
roller shutter share a profile catalogue and nothing else. Sizes are continuous, so
products morph rather than swap meshes: 486 morph targets in the door model alone.
That buys smooth resizing and costs you texture mapping, because a wood grain
stretches with the frame it is painted on.

## How I solved it

Products became data. One `CONFIGURATOR_CONFIG` declares shared pools and each family
references them by id, so an eighth family is an entry in an object rather than a new
controller. For the stretching, materials carry their projection axis in the name and
the vertex shader is patched through `onBeforeCompile` to use a world-space planar UV —
the frame grows, the grain stays put.

## What I'd do differently

The config object is doing two jobs: listing what exists and encoding how options
constrain each other. "Roller shutters have no glazing" is currently expressed by
omission, which is invisible until something renders wrong. I would also drop the
`_X`/`_Y`/`_Z` material-name convention for something checked at load time — it is a
clever trick I would have to explain to whoever inherits it.

TODO(pasha): was the seven-family scope known up front, or did it grow? If the config
object was a response to the third family arriving late, that is the better story.
