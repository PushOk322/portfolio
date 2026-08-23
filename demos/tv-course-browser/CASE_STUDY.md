# TV Course Browser

*The same React you know, with the mouse taken away.*

**Tech:** React 18 · webpack 5 · Zustand · Tizen · norigin-spatial-navigation · SCSS

---

## What it is

A Samsung Tizen television app for a video-course platform: browse a hero carousel and
horizontal rows, open a course, play a session. **Use the arrow keys** — there is
nothing to click, and that is the point.

115 of 214 commits are mine.

## The hard part

On the web, focus is mostly solved: tab order comes from the document, hover shows the
pointer, and anything findable is clickable. A remote removes all three. Everything on
screen has to be reachable by pressing four directions in some order — including things
below the fold and inside a horizontally scrolling row — and it has to be right
regardless of which screen the viewer arrived from.

## How I solved it

Spatial navigation resolves an arrow press to the nearest candidate by measured
coordinates, so layout defines navigation. The piece I wrote around it is
`useFocusableWithScroll`: whenever a node gains focus it centres its container in the
viewport. Focus and viewport stay welded together, so the focused card is always visible
— without it, focus walks off-screen and the app looks frozen.

## What I'd do differently

Focus restoration is implicit — it works because of how the tree happens to rebuild,
not because anything records where the viewer was. Navigating away and back is one of
the most common things they do, and it deserves an explicit saved focus key per screen.

TODO(pasha): was the LG webOS build the same codebase? The repo has `useWebOsHistory`
and `useTizenHistory` side by side — one app targeting both is a stronger claim.
