/**
 * Portfolio entry point.
 *
 * The production app was a React shell — routing, boosters, referrals, a TON wallet,
 * Telegram Stars payments — with the Phaser game as one screen inside it. None of that
 * survives outside Telegram: `LayoutProvider` returns early when `initData` is absent,
 * so the whole app rendered nothing in a normal browser.
 *
 * This boots the game directly. `src/game/` is untouched apart from the mocked API and
 * the no-op back button.
 *
 * What follows mirrors the mount effect of the React screen this replaces (Game.tsx).
 * Every line is load-bearing — the game reads these back later and does not guard:
 *
 *   startGame()             builds the Phaser game and the four UI singletons
 *   startUI()               assigns `ui`, which is `export let` and undefined until now
 *   ui.setFuncPreload()     `hidePreloaderText()` calls this unconditionally
 *   setHandleLeaderboard()  gameState.reset() calls it after every run
 *
 * Both starters must run in the same tick, before Phaser boots on the next animation
 * frame, so the scenes find a UI to talk to.
 */
import { game, gameUI, gameOverUI, aboutGameUI, leaderboardPreGameUI, startGame } from '@/game/main'
import { gameState } from '@/game/game/state/state'
import { startUI, ui } from '@/game/ui/ui'

startGame()
startUI()

// In the React app this toggled a loading overlay owned by the component. There is no
// such overlay here, so it is a no-op — but it has to exist, because
// `UI.hidePreloaderText()` calls `this.setPreload(false)` without checking, and that
// runs at exactly the moment the game becomes playable.
ui.setFuncPreload(() => {})

// `gameState.reset()` fires this after every run to refresh the standings. Guarded
// upstream, so omitting it would not crash — the leaderboard would just quietly stop
// updating, which is worse to diagnose than a crash.
gameState.setHandleLeaderboard(() => {
  void gameState.setTopLeaderboard()
})

// Populate the pre-game leaderboard once on load, as the screen did.
void gameState.setTopLeaderboard()
leaderboardPreGameUI.setIsShowLeaderboard(false)

// Handy when checking the demo by hand; the production build had the same escape hatch.
Object.assign(globalThis, { __GAME__: { game, gameUI, gameOverUI, aboutGameUI, ui, gameState } })
