export type StatusType = 'loading' | 'success' | 'error' | 'init'
export type StringNull = string | null
export type NumNull = number | null
export type NumStr = string | number
export type LocaleType = 'en' | 'ru' | 'uk'
export type TextAlignType = 'center' | 'right' | 'left'
export type PageType = 'achievements' | 'daily' | 'total'
export type LevelNameType = Record<'current' | 'next', LevelType | ''>
export type ToastType = 'info' | 'error'
export type SubscribeKeyType = 'youtube' | 'telegram' | 'x' | 'instagram'
export type BoosterKeyType =
  | 'recharge'
  | 'earn'
  | 'turbo'
  | 'critical-chance'
  | 'critical-cof'
  | 'energy-volume'
  | 'recharge-speed'
  | 'autoshaker'

export type BtnVariantType =
  | 'x-small'
  | 'x-small-secondary'
  | 'small'
  | 'default'
  | 'secondary'
  | 'light'
  | 'light-normal'
  | 'light-secondary'
  | 'small-light'
  | 'nav'
  | 'invite'
  | 'small-secondary'
  | 'small-dark-secondary'
  | 'light-block'
  | 'progress'
  | 'scales'
  | 'neon'
  | 'two-story'
  | 'two-story-secondary'
  | 'square-like'

export type LevelType =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'titanium'
  | 'uranium'
  | 'quantum'
  | 'cosmic'
  | 'galactic'

export interface ITab {
  id: string
  labelIcon?: string
  labelIconWebp?: string
  label: string
  page: PageType
  hasUnclaimed: boolean
}

export interface IDeviceMotion {
  x: number | null
  y: number | null
  z: number | null
}

export interface IImage {
  src: string
  webp: string
}

export interface ISubInfo {
  text: string
  icon_x4: IImage
  icon: IImage
}

export interface IInfoBlock {
  icon: string
  iconWebp: string
  title: string
  text: string
  underText?: string
  undertextArrow?: boolean
}
