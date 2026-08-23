// @ts-nocheck

import { PHYSIC, SPRITE } from '@/game/utils/constants'
import PlanetSlice from '@/game/game/entities/planet-slice'
import { State } from '@/game/game/state'
import { gameUI } from '@/game/main'

export default class Planet extends Phaser.GameObjects.Image {
  private point: number
  private gameState: State
  private id: number

  constructor(scene: Phaser.Scene, texture: string, point: number, id: number) {
    super(scene, Phaser.Math.Between(PHYSIC.PLANET.minX, PHYSIC.PLANET.maxX), PHYSIC.PLANET.y, texture)

    this.point = point
    this.gameState = new State()
    this.id = id

    this.scene.add.existing(this)

    this.baseScale = PHYSIC.PLANET.scale[id] * this.gameState.scaleCoef

    this.setScale(this.baseScale)
  }

  jump() {
    this.body.isCircle = true
    this.body.setBounce(1)
    this.body.setGravityY(-100)
    this.body.setVelocity(
      Phaser.Math.Between(-PHYSIC.PLANET.radius, PHYSIC.PLANET.radius),
      Phaser.Math.Between(
        PHYSIC.PLANET.maxVelocityY * this.gameState.speedForce,
        PHYSIC.PLANET.minVelocityY * this.gameState.speedForce
      )
    )

    this.body.setAngularVelocity(Phaser.Math.Between(-PHYSIC.PLANET.radius, PHYSIC.PLANET.radius))
  }

  divide(angle) {
    this.gameState.addToScore(this.point)
    gameUI.showAddingScore(this.point, { x: this.x, y: this.y })

    const velocity = this.body?.velocity
    const deg = Phaser.Math.RadToDeg(angle)

    let startTan, endTan
    let velocityXOne, velocityXTwo, velocityYOne, velocityYTwo

    if (deg < 0) {
      startTan = Math.PI * 2 + angle

      endTan = startTan - Math.PI
    } else {
      startTan = angle

      endTan = startTan + Math.PI
    }

    const slice2 = new PlanetSlice(
      this.scene,
      this.x,
      this.y,
      startTan,
      endTan,
      true,
      this.texture,
      this.id,
      SPRITE.CORE2,
      this.scale
    )

    const slice1 = new PlanetSlice(
      this.scene,
      this.x,
      this.y,
      startTan,
      endTan,
      false,
      this.texture,
      this.id,
      SPRITE.CORE1,
      this.scale
    )

    velocityXOne = 50 * Math.sin(angle) * -15
    velocityXTwo = 50 * Math.sin(angle) * 15
    velocityYOne = 25 * Math.cos(angle) * 15
    velocityYTwo = 25 * Math.cos(angle) * -15

    slice1.setVelocity(velocityXOne, velocityYOne)
    slice2.setVelocity(velocityXTwo, velocityYTwo)

    this.scene.time.delayedCall(4000, () => {
      slice1.destroyAll()
      slice2.destroyAll()
    })
  }

  updateGravity() {
    if (this.y < document.body.offsetHeight / 2) {
      this.body.setGravityY(400)
    }
  }
}
