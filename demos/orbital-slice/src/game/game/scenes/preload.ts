import { asteroidAudio, bgAudio, blackHoleAudio, explosionAudio, menuAudio } from '@/game/assets/audio'
import {
  asteroid1,
  asteroid2,
  planet1,
  planet2,
  planet3,
  planet4,
  planet5,
  planet6,
  planet7,
  planetCore1,
  planetCore2,
} from '@/game/assets/entities'
import {
  asteroidSheet,
  asteroidSheetJSON,
  blackHole,
  blackHoleRed,
  explosionPurple,
  laserPurpleSheet,
  laserPurpleSheetJSON,
  slicePurple,
  starSheet,
  starSheetJSON,
} from '@/game/assets/sheets'
import { gameState } from '@/game/game/state/state'
import { gameUI } from '@/game/main'
import { ui } from '@/game/ui/ui'
import { AUDIO, LASER, PHYSIC, SCENE, SPRITE, TILE } from '@/game/utils/constants'
import { gameApi } from '@/services/api/game.api'

const isToday = (date: string | Date): boolean => {
  const parsedDate = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return (
    parsedDate.getDate() === today.getDate() &&
    parsedDate.getMonth() === today.getMonth() &&
    parsedDate.getFullYear() === today.getFullYear()
  )
}

export class Preload extends Phaser.Scene {
  constructor() {
    super(SCENE.PRELOAD)
  }

  preload() {
    this.load.atlas(TILE.ASTEROID, asteroidSheet, asteroidSheetJSON)
    this.load.atlas(TILE.STAR, starSheet, starSheetJSON)

    this.load.atlas(LASER.PURPLE.LASER, laserPurpleSheet, laserPurpleSheetJSON)

    this.load.image(PHYSIC.PLANET.sprites[0], planet1)
    this.load.image(PHYSIC.PLANET.sprites[1], planet2)
    this.load.image(PHYSIC.PLANET.sprites[2], planet3)
    this.load.image(PHYSIC.PLANET.sprites[3], planet4)
    this.load.image(PHYSIC.PLANET.sprites[4], planet5)
    this.load.image(PHYSIC.PLANET.sprites[5], planet6)
    this.load.image(PHYSIC.PLANET.sprites[6], planet7)

    this.load.image(PHYSIC.STEROID.sprites[0], asteroid1)
    this.load.image(PHYSIC.STEROID.sprites[1], asteroid2)

    this.load.image(SPRITE.CORE1, planetCore1)
    this.load.image(SPRITE.CORE2, planetCore2)

    this.load.spritesheet(LASER.PURPLE.SLICE, slicePurple, {
      frameWidth: 400,
      frameHeight: 60,
    })

    this.load.spritesheet(LASER.PURPLE.EXPLOSION, explosionPurple, {
      frameWidth: 150,
      frameHeight: 150,
    })

    this.load.spritesheet(PHYSIC.RIP.sprites[0], blackHole, {
      frameWidth: 250,
      frameHeight: 250,
    })
    this.load.spritesheet(PHYSIC.RIP.sprites[1], blackHoleRed, {
      frameWidth: 250,
      frameHeight: 250,
    })

    this.load.audio(AUDIO.EXPLOSION, explosionAudio)
    this.load.audio(AUDIO.ASTEROID, asteroidAudio)
    this.load.audio(AUDIO.BLACK_HOLE, blackHoleAudio)
    this.load.audio(AUDIO.GAME_MUSIC, bgAudio)
    this.load.audio(AUDIO.MENU_MUSIC, menuAudio)

    async function getDailyCombo() {
      const data = (await gameApi.getCombo()).data
      const planets = (await gameApi.getPlanets()).data.planets
      const userStats = (await gameApi.getUserStats()).data

      gameState.bonusArray = [data.planet_1, data.planet_2, data.planet_3, data.planet_4, data.planet_5]
      PHYSIC.PLANET.points = planets.sort((a, b) => a.planet_id - b.planet_id).map(elem => elem.points_real)

      gameUI.setBestValue(String(userStats.planet_slice_best_score))
      gameState.bonusScore = data.bonus_real
      gameUI.setBonusPoint(data.bonus_real)
      gameState.isToday = userStats.last_combo_at && isToday(userStats.last_combo_at)
      gameState.isGetBonus = userStats.last_combo_at && isToday(userStats.last_combo_at)

    }

    getDailyCombo()

    this.load.on('progress', (value: number) => {
      ui.setProgress(value * 100)
    })

    this.load.on('complete', () => {
      this.scene.start(SCENE.MENU)

      ui.hidePreloaderText()

      PHYSIC.PLANET.y = document.body.offsetHeight + 125
      PHYSIC.STEROID.y = document.body.offsetHeight + 125
      PHYSIC.RIP.maxY = document.body.offsetHeight / 2
    })
  }

  create() {
    this.loadAssets()
  }

  loadAssets() {
    this.load.start()
  }
}
