# Demo notice

Modified portfolio build. Client branding, proprietary data, and backend
integrations have been removed or replaced with mock data. Not the production
application. Source structure preserved for demonstration purposes only.

---

## Specific to this demo

**TV Course Browser** — a Samsung Tizen television app for a video-course platform.
Navigation is D-pad spatial focus: arrow keys move between cards, Enter selects.
Built by Pavlo Tyshkovets at **Avada Media**.

**Use your arrow keys.** There is nothing to click — that is the point of the demo,
not a bug. It runs in a normal desktop browser because the app uses standard
keyboard events; only one `tizen.*` call exists in the entire source.

What changed:

- Every network call is intercepted and answered from local fixtures. Eight
  invented courses, 77 sessions. No real course titles, instructors or customer data.
- The code-entry login wall is bypassed with a fake session. In production you paired
  the TV with an account on your phone first; there is no account system here, so the
  wall could never be satisfied.
- The client's name was removed, along with an internal API specification file that
  was sitting in the repo root.
- A hardcoded Basic-auth credential was replaced with a placeholder.
- A 69 MB video file — referenced nowhere in the source — was left out.
- Google Fonts replaced with self-hosted copies. **No third-party requests.**

See `CHANGES.md` for the exact list.
