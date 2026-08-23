# Orbital Slice

*A swipe is a path, not a point.*

**Tech:** Phaser 3 · TypeScript · Vite · sprite atlases · particle emitters · localStorage

---

## What it is

A slicing arcade game: planets arc up the screen, you swipe to cut them, asteroids end
your run and black holes drag everything off course. It shipped as the game layer of a
Telegram Mini App; this build is the game lifted out of that shell.

536 of 895 commits are mine.

## The hard part

Continuous input in a discrete-frame world. A swipe is the path between where the
pointer was last frame and where it is now, and on a fast flick that path crosses a
third of the screen. Test the pointer's current position against planet bounds and you
miss nearly everything — players read that as a game ignoring them.

## How I solved it

`Laser.update(delta)` subdivides the frame: it splits the pointer's movement vector into
increments and walks a collider along that path one step at a time, so a flick crossing
three planets registers three cuts in order. Substepping rather than a line-versus-bounds
test, which composes with Phaser's arcade physics instead of fighting it — and the blade
trail falls out for free, one particle per substep.

## What I'd do differently

`steps = Math.floor(delta)` is a latent divide-by-zero: on a display fast enough for a
sub-millisecond frame it is 0 and the collider leaves the world. Game state and UI state
are also the same object, which is why there are no tests — the logic cannot run without
the DOM.

TODO(pasha): is the black hole's `attractionForce` a real per-frame pull or a scripted
tween? It is the most distinctive mechanic in the game.
