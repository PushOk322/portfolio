# TV Course Browser

*A Samsung Tizen TV app — the same React you know, with the mouse taken away.*

**Tech:** React 18 · webpack 5 · Zustand · Tizen · norigin-spatial-navigation · SCSS

---

## What it is

A television app for a video-course platform: browse courses on a hero carousel and
horizontal rows, open a course, play a session. It ran on Samsung Tizen sets, with a
sibling build for LG webOS. You pair the TV with your account by entering a code on your
phone; after that it is arrow keys and OK.

115 of 214 commits are mine. **Use the arrow keys** — there is nothing to click, and
that is the point.

## The hard part

On the web, focus is mostly solved: tab order comes from the document, hover shows the
pointer, and anything findable is clickable. A remote removes all three. There are four
directions and a confirm button, and everything on screen has to be reachable by pressing
them in some order — including things below the fold, inside a horizontally scrolling row.

That last part is what makes it hard rather than tedious. Focus is not a property of a
component, it is a property of the whole screen, and it has to be right regardless of the
route taken to get there. Arrive at a course row from the hero and focus should land on
the first card; come back from a course page and it should land on the card you left.

Then there is the 10-foot problem: the viewer is three metres away, the hardware is slow,
and there is no scrollbar to hint that there is more.

## How I solved it

Spatial navigation via `@noriginmedia/norigin-spatial-navigation`, which builds a tree of
focusable nodes and resolves an arrow press to the nearest candidate in that direction by
measured coordinates. Layout defines navigation: a row of cards is navigable because it
*looks* like a row.

The piece I wrote around it is `useFocusableWithScroll` — a hook wrapping `useFocusable`
so that whenever a node gains focus it walks up to its nearest `.container` and calls
`scrollIntoView({ block: 'center', inline: 'center' })`. Focus and viewport stay welded
together, so the focused card is always centred and the viewer can always see what is
next to it. Without that, focus walks off-screen and the app looks frozen.

Screens are wrapped in `FocusContext.Provider` boundaries, which is what makes focus
recoverable per region rather than globally.

## What I'd do differently

Focus restoration is implicit. It works because of how the tree happens to rebuild, not
because anything records where the user was. Navigating away and back is one of the most
common things a viewer does, and it deserves an explicit saved focus key per screen
rather than being an emergent property.

The seven Zustand stores each own their fetching, caching and error handling, duplicated
with small differences. On a TV, where a request can take seconds and fail quietly, that
shows: some screens spin forever, some show nothing. One data layer with a shared retry
and error contract would have been a day's work.

TODO(pasha): was the LG webOS build a port or a separate app? The repo has
`useWebOsHistory` and `useTizenHistory` side by side, which suggests one codebase
targeting both — a stronger claim than "a Tizen app", and it belongs in the first line.
