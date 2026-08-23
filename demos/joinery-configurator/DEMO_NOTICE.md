# Demo notice

Modified portfolio build. Client branding, proprietary data, and backend
integrations have been removed or replaced with mock data. Not the production
application. Source structure preserved for demonstration purposes only.

---

## Specific to this demo

**Joinery Configurator** — a real-time 3D configurator covering seven product
families: windows, interior doors, front exterior doors, garden/terrace doors,
sliding doors, sectional garage doors and roller shutters. Built by Pavlo
Tyshkovets at **Marevo Vision** for a joinery manufacturer.

What changed for this build:

- The client's name was replaced throughout with the neutral "Joinery".
- Header and loader artwork belonging to **a different client** — left over in the
  skeleton this project was started from — was removed and replaced with generated
  neutral art.
- The client integration documentation (`docs/integration/`) was removed. It is
  their commercial contract, not a code sample.
- Three external requests were removed: a QR code service, Google Fonts, and a
  hotlinked icon. **The demo now makes no third-party requests at all.**
- A superseded 3D model and six unused environment maps were dropped.
- A dismissible "Portfolio build" badge in the corner.

The product geometry, the finish and hardware catalogue, and the configurator
logic are the real ones. There is no backend, no account, and no pricing here —
this build never had any.

See `CHANGES.md` for the exact list, including a compression attempt that the
project's own test suite rejected.
