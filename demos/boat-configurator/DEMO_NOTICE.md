# Demo notice

Modified portfolio build. Client branding, proprietary data, and backend
integrations have been removed or replaced with mock data. Not the production
application. Source structure preserved for demonstration purposes only.

---

## Specific to this demo

**Boat Configurator** — a real-time 3D configurator: orbit the hull, fit an
outboard engine, change upholstery material and recolour the interior and hull.
Built by Pavlo Tyshkovets at **Avada Media** for an aluminium boat manufacturer.

What changed:

- The client's brand is gone, and the engine models were renamed. The originals
  carried two outboard manufacturers' trademarks in their filenames — not the
  client's marks to redistribute. The geometry is unchanged.
- **The option catalogue is invented.** In production the entire option tree
  arrived from the backend as a schema and the UI was generated from it. There is
  no saved copy of that payload, so this build declares an equivalent catalogue
  locally. The engine list, materials and colours are plausible, not real.
- The e-commerce app around the configurator — cart, accounts, six auth screens,
  personal cabinet, trailers, tuning, PDF quotes — was removed. A hand-built
  control panel drives the same scene API instead.
- The Draco decoder is now served from this site rather than a Google CDN, and the
  webfont is self-hosted. **The demo makes no third-party requests.**

`src/three/` is the original scene layer, untouched apart from asset paths and a
progress callback: `ThreejsApplication` → `BoatApplication`, with its own `Camera`,
`Renderer`, `Sizes`, `Time`, `SceneLights`, `AnnotationMaker` and `EventEmitter`.

See `CHANGES.md` for the exact list.
