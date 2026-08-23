# Demo notice

Modified portfolio build. Client branding, proprietary data, and backend
integrations have been removed or replaced with mock data. Not the production
application. Source structure preserved for demonstration purposes only.

---

## Specific to this demo

**Canvas Studio** — a set of 2D canvas experiments: a Fabric.js t-shirt designer, a
Konva creature builder, a particle field, a starfield, a scroll sequence, a hover
card, and three charts drawn by hand rather than by a charting library. Built by
Pavlo Tyshkovets at **Avada Media**. Published here as a showcase of the work.

There was no client brand and no backend. What changed:

- A trademarked logo used as sample artwork was replaced with generated neutral art.
- The nine pages had no links between them; a shared nav strip was added.
- The Fabric.js designer was promoted to the landing page — it was previously
  unreachable from the entry point.
- Chart.js was being loaded from a CDN on one page despite already being an npm
  dependency; it now comes from the bundle. **The demo makes no external requests.**
- A scale-to-fit layer was added so the fixed-width desktop canvases are usable on
  a phone.
- A dismissible "Portfolio build" badge in the corner.

No mock data was introduced — there was no data layer to mock. Every chart still
generates its own random values exactly as it always did.

See `CHANGES.md` for the exact list.
