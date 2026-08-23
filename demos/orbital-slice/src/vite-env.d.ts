/// <reference types="vite/client" />

import { LevelType } from '@/types/common.types'

interface ImportMetaEnv {
  readonly VITE_IS_UPDATING: string
  readonly VITE_BASE_URL: string
  readonly VITE_API_SHAKE: string
  readonly VITE_API_PROFILE: string
  readonly VITE_API_PROFILE_STAT: string
  readonly VITE_API_LANGUAGE: string
  readonly VITE_API_LEVELS: string
  readonly VITE_API_AUTOSHAKER: string
  readonly VITE_API_BOOSTER_RECHARGE: string
  readonly VITE_API_BOOSTER_TURBO: string
  readonly VITE_API_BOOSTER_CRITICAL_CHANCE: string
  readonly VITE_API_BOOSTER_CRITICAL_COF: string
  readonly VITE_API_BOOSTER_EARN_SHAKE: string
  readonly VITE_API_BOOSTER_EVERGY_VOLUME: string
  readonly VITE_API_BOOSTER_RECHARGING_SPEED: string
  readonly VITE_API_BOOSTERS: string
  readonly VITE_API_ROADMAP: string
  readonly VITE_API_GAMES: string
  readonly VITE_API_INVITES: string
  readonly VITE_API_STATS_FRIENDS: string
  readonly VITE_API_STATS_INVITES: string
  readonly VITE_API_DAILY_REWARDS: string
  readonly VITE_API_QUESTS_DAILY: string
  readonly VITE_API_QUESTS_ONE_TIME: string
  readonly VITE_API_GROWTH_REWARDS: string
  readonly VITE_API_GAME_START: string
  readonly VITE_API_BUY_ADDITIONAL_ATTEMPT: string
  readonly VITE_API_GET_ADDITIONAL_ATTEMPTS: string
  readonly VITE_API_MARSERS: string
  readonly VITE_API_MARSERS_USER_MARSER: string
  readonly VITE_API_MARSERS_VIDEOCARDS: string
  readonly VITE_API_MARSERS_USER_MARSER_VIDEOCARDS: string
  readonly VITE_API_ADD_WALLET: string
  readonly VITE_API_DELETE_WALLET: string
  readonly VITE_API_EXCHANGES_BURN: string
  readonly VITE_API_EXCHANGES_WITHDRAW: string
  readonly VITE_CRYSTAL_EXCHAGE_RATE: number
  readonly VITE_SHAKE_THROTTLING: number
  readonly VITE_SHAKE_THROTTLING: number
  readonly VITE_SHAKE_OUT_TIME: number
  readonly VITE_SHAKE_NAVIGATION_SEND_PREVENT_TIME: number
  readonly VITE_SHAKE_ALL_TIME: number
  readonly VITE_SHAKE_ANIMATE_TIME: number
  readonly VITE_INVITE_LINK: string
  readonly VITE_INVITE_COIN: number
  readonly VITE_INVITE_COIN_PREMIUM: number
  readonly VITE_BOT_LINK: string
  readonly VITE_BRONZE_LEVEL_MAX: number
  readonly VITE_SILVER_LEVEL_MAX: number
  readonly VITE_GOLD_LEVEL_MAX: number
  readonly VITE_PLATINUM_LEVEL_MAX: number
  readonly VITE_DIAMOND_LEVEL_MAX: number
  readonly VITE_TITANIUM_LEVEL_MAX: number
  readonly VITE_URANIUM_LEVEL_MAX: number
  readonly VITE_QUANTUM_LEVEL_MAX: number
  readonly VITE_COSMIC_LEVEL_MAX: number
  readonly VITE_FIRST_LEVEL_NAME: LevelType
  readonly VITE_SECOND_LEVEL_NAME: LevelType
  readonly VITE_THIRD_LEVEL_NAME: LevelType
  readonly VITE_FOURTH_LEVEL_NAME: LevelType
  readonly VITE_FIFTH_LEVEL_NAME: LevelType
  readonly VITE_SIXTH_LEVEL_MAX: LevelType
  readonly VITE_SEVENTH_LEVEL_MAX: LevelType
  readonly VITE_EIGHTH_LEVEL_MAX: LevelType
  readonly VITE_NINTH_LEVEL_MAX: LevelType
  readonly VITE_TENTH_LEVEL_MAX: LevelType
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.svg' {
  import { FC, SVGProps } from 'react'

  const content: FC<SVGProps<SVGSVGElement>>
  export default content
}
