# Orbital Slice

*Phaser 3 arcade game — a swipe is a path, not a point.*

**Tech:** Phaser 3 · TypeScript · Vite · sprite atlases · particle emitters · localStorage

---

## What it is

A slicing arcade game: planets arc up from the bottom of the screen, you swipe across
them to cut them for points, asteroids end your run, and black holes drag everything
off-course. There is a daily bonus combo — five specific planets in one run — and a
leaderboard.

It shipped as the game layer of a Telegram Mini App — boosters, referrals, a TON wallet,
Telegram Stars payments. 536 of 895 commits are mine. This build is the game lifted out
of that shell: the game travels, the economy cannot.

## The hard part

Slicing is continuous input in a discrete-frame world. A swipe is not a point, it is the
path between where the pointer was last frame and where it is now — and on a fast flick
that path can cross a third of the screen. Test the pointer's current position against
planet bounds and you miss nearly everything: the planet was never *at* the pointer on
any frame, it was crossed in between. Players read that as a game ignoring them, which is
worse than one that is hard.

The trail has the same problem from the other side. One particle per frame at the pointer
gives you a dotted line on a fast swipe, and the blade is most of the game's feel.

## How I solved it

`Laser.update(delta)` subdivides the frame. It takes the vector from `lastCoords` to
`newCoords`, splits it into `steps = floor(delta)` increments, and walks a collider along
that path one increment at a time — so a flick crossing three planets registers three
cuts, in the order they were crossed. Substepping rather than a line-versus-bounds test,
which means it composes with Phaser's arcade physics instead of fighting it, and the
trail falls out for free: each substep emits a particle, so the blade stays continuous at
any speed.

Swipe speed drives the look too: `stepDiff` selects between three particle emitters and
stretches the sprite past a threshold, so a slow drag and a hard flick leave different
marks. Difficulty is layered rather than random — concurrent entities are capped while
`setComplications()` ramps attraction and speed on a timer, so randomness picks which
planet and where, never how many.

## What I'd do differently

`steps = Math.floor(delta)` is a latent divide-by-zero. On a display fast enough for a
sub-millisecond frame, `steps` is 0, every increment becomes `Infinity`, and the collider
leaves the world. It has never fired — but tying substep count to
milliseconds-as-an-integer works only until the hardware changes. It should subdivide by
distance, with a floor of 1.

Game state and UI state are also the same object: `gameState` holds score, lives, and
whether the leaderboard modal is open. That is why there are no automated tests — the
logic cannot run without the DOM. For physics-adjacent code that is what I would fix first.

TODO(pasha): is the black-hole `attractionForce` a real per-frame pull on nearby bodies,
or a scripted curve on the planet's tween? I could not tell from `rip.ts`, and it is the
most distinctive mechanic in the game.
