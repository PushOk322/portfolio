# Demo notice

Modified portfolio build. Client branding, proprietary data, and backend
integrations have been removed or replaced with mock data. Not the production
application. Source structure preserved for demonstration purposes only.

---

## Specific to this demo

**Orbital Slice** — a Phaser 3 arcade game: slash across planets to slice them,
avoid asteroids and black holes, chase the daily bonus combo. Built by Pavlo
Tyshkovets at **Avada Media** as the game layer of a Telegram Mini App.

This is an **extraction**, not the original product. What was removed:

- The React shell around it — boosters, referrals, invites, a TON crypto wallet,
  Telegram Stars payments and the tap-to-earn economy. None of it works outside
  Telegram, and none of it is the interesting part.
- The Telegram host dependency. The production app rendered nothing in a normal
  browser: it waited for `initData` that only Telegram supplies.
- Every backend call. The daily combo, planet point table, player stats and both
  leaderboards now resolve from local fixtures with invented values.
- The client's product name and branding.

`src/game/` — 2,524 lines of scenes, entities, the space generator and the UI
layer — is the original code. Your best score is kept in `localStorage`; nothing
leaves the browser, and the demo makes no third-party requests.

See `CHANGES.md` for the exact list.
