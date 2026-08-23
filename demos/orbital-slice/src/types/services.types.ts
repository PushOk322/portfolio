/**
 * Types the game layer uses.
 *
 * The original file carried the whole Mini App's API surface — boosters, referrals,
 * wallet, top-ups, the client's own product nouns. The game only ever touched the
 * handful below, and the rest named things this build does not contain, so it was
 * trimmed rather than shipped as dead vocabulary.
 *
 * Shapes are unchanged from production; the data behind them is invented
 * (see src/services/api/fixtures.json).
 */

export interface IDailyCombo {
  planet_1: number
  planet_2: number
  planet_3: number
  planet_4: number
  planet_5: number
  bonus_real: number
  bonus_visible: number
}

export interface IPlanets {
  planets: Array<{
    planet_id: number
    image: string
    name_uk: string
    name_ru: string
    name_en: string
    points_real: number
    points_visible: number
  }>
}

export interface IClaimCombo {
  bonus?: number
  score?: number
}

export interface IUserStats {
  planet_slice_best_score: number
  // `any` as in the original. These are nullable timestamps, and the preload assigns
  // `last_combo_at && isToday(...)` straight to a boolean — tightening the type here
  // would mean changing game logic, which is not this build's job.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  planet_slice_finished_at: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  last_combo_at: any
}

export interface IPlanetSliceLeaderboardFetchParams {
  is_daily: boolean
  offset: number
  limit: number
}

export interface IPlanetSliceLeader {
  username: string
  time_in_game: Date
  score: number
  avatar_url: string
}

export interface IPlanetSliceTopLeader {
  username: string
  position: number
  coin_reward: number
  ton_reward: number
  avatar_url: string
  is_current_user: boolean
}

export interface ILeaderboard {
  leaderboard: Array<IPlanetSliceLeader>
  total_count: number
}

export interface ICurrentUser {
  position: number
  available_attempts: number
  available_free_attempts: number
  is_unlimited_attempts: boolean
}

export interface ITopLeaderboard {
  leaderboard: Array<IPlanetSliceTopLeader>
  current_user: ICurrentUser
}
