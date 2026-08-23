/**
 * Mock game API — portfolio build.
 *
 * The production game talked to a Telegram Mini App backend for the daily combo, the
 * planet point table, the player's stats and two leaderboards. None of that exists
 * here, so this module keeps the exact same shape and resolves from local fixtures
 * instead. The game code is unchanged: it still awaits these calls in `preload`,
 * `state` and the game-over screen and never learns the difference.
 *
 * Fixtures live in `src/services/api/fixtures.json`. Values are invented; the shapes
 * are the real ones (see `src/types/services.types.ts`).
 *
 * The one piece of real state is the best score, which persists in localStorage —
 * without it a demo has no memory between runs and the "best" readout is always 0.
 */
import type {
  IClaimCombo,
  IDailyCombo,
  ILeaderboard,
  IPlanets,
  IPlanetSliceLeaderboardFetchParams,
  ITopLeaderboard,
  IUserStats,
} from '@/types/services.types'

import fixtures from './fixtures.json'

const BEST_SCORE_KEY = 'orbital-slice:best-score'

// The real client returned an axios response, and callers read `.data`. Keeping that
// wrapper is cheaper than editing every call site — and leaves the call sites honest
// about what the production code looked like.
const respond = <T>(data: T): Promise<{ data: T }> =>
  new Promise(resolve => setTimeout(() => resolve({ data }), 60))

function readBestScore(): number {
  const raw = localStorage.getItem(BEST_SCORE_KEY)
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function recordBestScore(score: number): void {
  if (score > readBestScore()) localStorage.setItem(BEST_SCORE_KEY, String(score))
}

export const gameApi = {
  getCombo: async () => respond<IDailyCombo>(fixtures.dailyCombo),

  getPlanets: async () => respond<IPlanets>(fixtures.planets),

  getUserStats: async () =>
    respond<IUserStats>({
      planet_slice_best_score: readBestScore(),
      planet_slice_finished_at: null,
      // null, not a date: a timestamp from today would put the game straight into
      // "bonus already claimed" and hide the combo mechanic on a first visit.
      last_combo_at: null,
    }),

  getUserLeaderboard: async (params: IPlanetSliceLeaderboardFetchParams) =>
    respond<ILeaderboard>({
      // `time_in_game` is typed Date but arrives as a JSON string over the wire, so the
      // real payload never matched the interface either. Cast rather than widen the
      // shared type: the game only ever renders this field.
      leaderboard: fixtures.leaderboard.slice(
        params.offset,
        params.offset + params.limit
      ) as unknown as ILeaderboard['leaderboard'],
      total_count: fixtures.leaderboard.length,
    }),

  getUserTopLeaderboard: async () =>
    respond<ITopLeaderboard>({
      leaderboard: fixtures.topLeaderboard,
      current_user: {
        position: 42,
        available_attempts: 99,
        available_free_attempts: 99,
        is_unlimited_attempts: true,
      },
    }),

  // Write paths are no-ops. They resolve so the game's await chains complete, but
  // nothing leaves the browser.
  claimReward: async (data: IClaimCombo) => respond(data),

  sendStart: async () => respond('ok'),
}
