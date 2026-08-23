import { AboutGameUI } from '@/game/ui/about-game'
import { GameOver } from '@/game/ui/game-over'
import { GameUI } from '@/game/ui/game'
import Phaser from 'phaser'
import { scenes } from './game/scenes'
import './styles/index.scss'
import { LeaderboardPreGameUI } from '@/game/ui/leaderboard'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'game-root',
  canvas: document.getElementById('game-canvas') as HTMLCanvasElement,
  width: innerWidth,
  height: innerHeight,
  title: 'Galactic Slice',
  scene: scenes,
  version: '0.0.1',
  backgroundColor: '#000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 250 },
      // debug: true,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

export let gameUI
export let gameOverUI
export let aboutGameUI
export let game: Phaser.Game
export let leaderboardPreGameUI

export function startGame() {
  game = new Phaser.Game(config)
  globalThis.__PHASER_GAME__ = game
  gameUI = new GameUI()
  gameOverUI = new GameOver()
  aboutGameUI = new AboutGameUI()
  leaderboardPreGameUI = new LeaderboardPreGameUI()
}
