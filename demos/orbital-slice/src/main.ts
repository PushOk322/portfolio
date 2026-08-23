/**
 * Portfolio entry point.
 *
 * The production app was a React shell — routing, boosters, referrals, a TON wallet,
 * Telegram Stars payments — with the Phaser game as one screen inside it. None of that
 * survives outside Telegram: `LayoutProvider` returns early when `initData` is absent,
 * so the whole app rendered nothing in a normal browser.
 *
 * This boots the game directly. `src/game/` is untouched apart from the mocked API and
 * the no-op back button, which is the point: the game was already self-contained.
 */
import { startGame } from '@/game/main'

startGame()
