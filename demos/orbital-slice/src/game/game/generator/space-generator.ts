// @ts-nocheck

import { PHYSIC } from '@/game/utils/constants'
import Planet from '../entities/planet'
import Rip from '../entities/rip'
import { Space } from '../scenes/space'
import Steroid from '../entities/steroid'

export default class SpaceGenerator {
  scene: Space
  rip: Rip
  planet: Planet[] = []
  steroid: Steroid[] = []
  planetIndex: number = 0
  steroidIndex: number = 0
  timeout = (75 / 60) * 1000

  constructor(scene: Space) {
    this.scene = scene

    this.generator()
    this.generatorRip()

    this.ripTimerStarted = false

    this.stopGenerate = false

    this.gameState = scene.gameState

    this.ripDelay = window.innerWidth >= 1024 ? 500 : window.innerWidth < 1024 && window.innerWidth > 720 ? 3000 : 2500
    this.scene.gameState.setComplications()
    this.scene.gameState.setGameTime()
  }

  generator() {
    if (this.stopGenerate) return
    this.createPlanet()
    this.createSteroid()

    this.scene.time.delayedCall(this.timeout, () => {
      this.generator()
    })
  }

  generatorRip() {
    this.createRip()
  }

  createPlanet() {
    if (this.planet.length < 4) {
      this.planet.push(
        new Planet(
          this.scene,
          PHYSIC.PLANET.sprites[this.planetIndex],
          PHYSIC.PLANET.points[this.planetIndex],
          this.planetIndex
        )
      )

      this.scene.planets?.add(this.planet[this.planet.length - 1])

      this.planet[this.planet.length - 1].jump()

      this.planetIndex++

      this.planetIndex === 7 ? (this.planetIndex = 0) : null
    }
  }

  createSteroid() {
    if (this.steroid.length < 2 * this.scene.gameState.maxSteroids) {
      const random = Phaser.Math.Between(0, 100)

      if (random > 60 - this.scene.gameState.maxSteroids * 10) {
        this.steroid.push(
          new Steroid(
            this.scene,
            PHYSIC.STEROID.sprites[this.steroidIndex],
            PHYSIC.STEROID.points[this.steroidIndex],
            this.steroidIndex
          )
        )

        this.scene.steroid?.add(this.steroid[this.steroid.length - 1])

        this.steroid[this.steroid.length - 1].jump()

        this.steroidIndex++

        this.steroidIndex === 2 ? (this.steroidIndex = 0) : null
      }
    }
  }

  createRip() {
    this.rip = new Rip(this.scene, 0)
    this.isCreatedRip = true
    this.scene.rip?.add(this.rip)

    this.scene.rip?.getChildren()[0]?.jump()

    this.ripTimerStarted = false
  }

  destroyPlanets(elem: Planet) {
    const index = this.planet.findIndex(planet => planet === elem)
    this.planet.splice(index, 1)
    elem.destroy()
  }

  destroySteroid(elem: Steroid) {
    const index = this.steroid.findIndex(steroid => steroid === elem)
    this.steroid.splice(index, 1)
    elem.destroy()
  }

  destroyRip() {
    this.scene.rip?.clear(true, true)
  }

  checkBoundsRip() {
    if (this.rip.y <= PHYSIC.RIP.minY) {
      this.rip.y = PHYSIC.RIP.minY
    }

    if (
      this.rip.x < PHYSIC.RIP.minX ||
      this.rip.y < PHYSIC.RIP.minY ||
      this.rip.x > PHYSIC.RIP.maxX ||
      this.rip.y > PHYSIC.RIP.maxY
    ) {
      this.destroyRip()

      if (this.ripTimerStarted === false) {
        this.scene.time.addEvent({
          delay: this.ripDelay,
          callback: this.createRip,
          callbackScope: this,
          loop: false,
        })
        this.ripTimerStarted = true
      }
    }
  }

  checkBoundsPlanet() {
    this.planet.forEach(elem => {
      if (elem.y > PHYSIC.PLANET.y || elem.x < -150 || elem.x > PHYSIC.PLANET.maxX + 300) {
        this.destroyPlanets(elem)
      }
    })
  }

  checkBoundsSteroid() {
    this.steroid.forEach(elem => {
      if (
        elem.y > PHYSIC.STEROID.y ||
        elem.x < -PHYSIC.STEROID.minX ||
        elem.x > PHYSIC.STEROID.maxX + 300 ||
        elem.y < -125
      ) {
        this.destroySteroid(elem)
      }
    })
  }

  setStop(value) {
    this.stopGenerate = value
  }
}
