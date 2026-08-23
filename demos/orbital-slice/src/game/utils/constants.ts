import { SWORD } from './types'
import { contentSafeAreaTop } from './safe-area'

export const TILE = {
  SPACE: 'space',
  ASTEROID: 'asteroid',
  STAR: 'star',
}

export const SIZE = {
  TILE: 32,
  LOADER: {
    w: 500,
    h: 320,
  },
}

export const PHYSIC = {
  PLANET: {
    minX: 150,
    maxX: document.body.offsetWidth - 150,
    y: document.body.offsetHeight + 125,
    minVelocityY: -600,
    maxVelocityY: -700,
    radius: 50,
    sprites: ['planet1', 'planet2', 'planet3', 'planet4', 'planet5', 'planet6', 'planet7'],
    points: [5, 7, 9, 11, 13, 15, 17],
    scale: [2, 2, 2, 2, 2, 2, 2],
  },
  STEROID: {
    minX: 250,
    maxX: document.body.offsetWidth - 250,
    y: document.body.offsetHeight + 125,
    minVelocityY: -600,
    maxVelocityY: -700,
    radius: 50,
    sprites: ['asteroid1', 'asteroid2'],
    points: [-25, -50],
    scale: [1.5, 1.6],
  },
  RIP: {
    minX: -100,
    maxX: document.body.offsetWidth + 100,
    minY: contentSafeAreaTop() + 180,
    maxY: (document.body.offsetHeight + contentSafeAreaTop()) / 2,
    radius: 50,
    sprites: ['black-hole', 'black-hole-red'],
    scale: [1, 1.6],
    animations: ['black-hole', 'black-hole-red'],
  },
}

export const LAYER = {
  MENU: 'menu',
}

export const SPRITE = {
  PLAYER: 'Player',
  CORE1: 'planer-core1',
  CORE2: 'planet-core2',
  EXPLOSION: 'explosion',
  SLICE_RED: 'slice-red',
}

export const AUDIO = {
  EXPLOSION: 'explosion-sound',
  ASTEROID: 'asteroid-sound',
  BLACK_HOLE: 'black-hole-sound',
  GAME_MUSIC: 'bg-music',
  MENU_MUSIC: 'menu-music',
}

export const TEXTURE = {
  MENU: 'menu-bg',
  BTN: 'btn-bg',
  LOADER: 'loader',
}

export const SCENE = {
  MENU: 'MenuScene',
  SPACE: 'SpaceScene',
  PRELOAD: 'PreloadScene',
}

export interface LaserObject {
  LASER: string
  SLICE: string
  EXPLOSION: string
  TYPE: SWORD
}

interface LaserColors {
  [key: string]: LaserObject
}

export const LASER: LaserColors = {
  PURPLE: {
    LASER: 'laser-purple',
    SLICE: 'slice-purple',
    EXPLOSION: 'explosion-purple',
    TYPE: SWORD.PURPLE,
  },
}

export const ANIM = {
  SLICE: 'slice',
  EXPLOSION: 'explosion',
}

export enum MODE {
  ARCADE = 'arcade',
  CLASSIC = 'classic',
}
