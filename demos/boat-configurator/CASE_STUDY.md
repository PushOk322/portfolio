# Boat Configurator

*Three.js inside a React + TypeScript app — a shipped configurator for aluminium boats.*

**Tech:** React 18 · TypeScript · Redux Toolkit · Three.js · Draco · Vite · GSAP

---

## What it is

A configurator for an aluminium boat builder: orbit the hull, fit an outboard engine,
retexture the seats and deck, recolour interior and hull, jump the camera to the console.
In production it also priced the build and emailed a PDF quote — it was one screen inside
a larger e-commerce app with accounts, a cart and saved builds.

271 of 776 commits are mine, on a team of four.

## The hard part

Three.js and React want opposite things. React re-renders on state change and expects
components to be cheap and disposable. A WebGL scene is neither: it owns GPU resources,
mutates every frame, and must survive re-renders untouched. Put scene objects in
component state and you get either a re-render per frame or non-serialisable values in
the store — both bad in ways that surface late.

The option tree was also entirely server-driven. The backend returned a schema and the UI
was generated from it, so the 3D layer could not know at build time which options existed.
And engines attach to the hull rather than sitting beside it: each engine GLB carries an
`engine-attachment` node that has to be positioned onto the hull's `engine-point`, so
swapping an engine is a scene-graph edit, not a model swap.

## How I solved it

A hard line between the two worlds. `BoatApplication` extends a `ThreejsApplication` base
and owns everything WebGL — its own `Camera`, `Renderer`, `Sizes`, `Time`, `SceneLights`,
`AnnotationMaker` and an `EventEmitter`. It exposes an imperative API: `setEngine(path)`,
`setColor(name, hex)`, `setModelTexture({ objName, texture, color })`,
`moveCameraToConsole()`.

React never holds the instance in state — it lives in a ref. Redux holds the *choice*, and
an effect turns a choice into a method call. The scene has no idea React exists, which is
why replacing the server schema with a local catalogue for this portfolio build changed
nothing below that line. Progress and load events travel back out through the
`EventEmitter`, so the scene imports nothing from the UI.

Geometry is Draco-compressed: the hull is 3.65 MB across 240 meshes.

## What I'd do differently

`BoatApplication` is a singleton enforced by a module-scoped `instance`, and that decision
propagates — the React layer has to guard against StrictMode's double-invoke, and two
configurators on one page are impossible. It was the quick answer to "don't reload the
model on navigation"; a lifecycle owned by the mount point would have been barely more
work and none of the awkwardness.

I would also stop addressing meshes and materials by string name. `setColor('board', hex)`
walks the scene matching substrings — fast to write, and silently wrong the moment an
artist renames a node. A manifest generated from the GLB at build time turns a class of
invisible visual bugs into build errors.

TODO(pasha): is `AnnotationMaker` — 3D points projected to DOM overlays — yours or
inherited? If yours it deserves a paragraph; screen-space projection is a genuinely
tricky bit and it's invisible in this write-up.
