# Boat Configurator

*Three.js inside a React + TypeScript app, shipped to production.*

**Tech:** React 18 · TypeScript · Redux Toolkit · Three.js · Draco · Vite · GSAP

---

## What it is

A configurator for an aluminium boat builder: orbit the hull, fit an outboard, retexture
the seats and deck, recolour interior and hull. In production it also priced the build
and emailed a PDF quote.

271 of 776 commits are mine, on a team of four.

## The hard part

Three.js and React want opposite things. React re-renders on state change and expects
components to be cheap and disposable; a WebGL scene owns GPU resources and mutates
every frame. Put scene objects in component state and you get either a re-render per
frame or non-serialisable values in the store.

## How I solved it

A hard line. `BoatApplication` owns everything WebGL and exposes an imperative API —
`setEngine()`, `setColor()`, `setModelTexture()` — while React holds it in a ref, never
in state. Redux holds the *choice*; an effect turns a choice into a method call. The
scene has no idea React exists, which is why swapping the server schema for a local
catalogue in this build changed nothing below that line.

## What I'd do differently

`BoatApplication` is a module-scoped singleton, and that decision propagates: React has
to guard against StrictMode's double-invoke, and two configurators on one page are
impossible. I would also stop addressing meshes by string name — `setColor('board', hex)`
matches substrings and fails silently the moment an artist renames a node in Blender.

TODO(pasha): is `AnnotationMaker` — 3D points projected to DOM overlays — yours? If so it
deserves a paragraph of its own.
