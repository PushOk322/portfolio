// @ts-nocheck

import { PHYSIC } from '@/game/utils/constants'
import { State } from '@/game/game/state'

export default class Steroid extends Phaser.GameObjects.Image {
  private point: number
  private id: number

  constructor(scene: Phaser.Scene, texture: string, point: number, id: number) {
    super(scene, Phaser.Math.Between(PHYSIC.STEROID.minX, PHYSIC.STEROID.maxX), PHYSIC.STEROID.y, texture)

    this.point = point
    this.id = id
    this.isDestroyed = false

    this.scene.add.existing(this)

    this.gameState = new State()
    this.baseScale = PHYSIC.STEROID.scale[id] * this.gameState.scaleCoef
    this.setScale(this.baseScale)
  }

  jump() {
    this.body.isCircle = true

    this.body.setBounce(1)

    this.body.setVelocity(
      Phaser.Math.Between(-PHYSIC.STEROID.radius, PHYSIC.STEROID.radius),
      Phaser.Math.Between(PHYSIC.STEROID.maxVelocityY, PHYSIC.STEROID.minVelocityY)
    )

    this.body.setAngularAcceleration(Phaser.Math.Between(-PHYSIC.STEROID.radius, PHYSIC.STEROID.radius))
  }
}
