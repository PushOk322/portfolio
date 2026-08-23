// @ts-nocheck

import { PHYSIC } from '@/game/utils/constants'
import { State } from '../state'

export default class Rip extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, id: number) {
    const random = Phaser.Math.Between(0, 100),
      randomX = Phaser.Math.Between(0, 100),
      randomY = Phaser.Math.Between(0, 100)

    // super(
    // 	scene,
    // 	random > 50
    // 		? Phaser.Math.Between(PHYSIC.RIP.minX, PHYSIC.RIP.maxX)
    // 		: randomeX > 50
    // 			? PHYSIC.RIP.minX
    // 			: PHYSIC.RIP.maxX,
    // 	random > 50
    // 		? randomY > 50
    // 			? PHYSIC.RIP.minY
    // 			: PHYSIC.RIP.maxY
    // 		: Phaser.Math.Between(PHYSIC.RIP.minY, PHYSIC.RIP.maxY),
    // 	texture
    // );
    super(
      scene,
      randomX > 50 ? PHYSIC.RIP.minX : PHYSIC.RIP.maxX,
      Phaser.Math.Between(PHYSIC.RIP.minY, PHYSIC.RIP.maxY),
      PHYSIC.RIP.sprites[0]
    )

    this.destroyed = false

    this.scene.add.existing(this)

    this.gameState = new State()
    this.baseScale = PHYSIC.RIP.scale[id] * this.gameState.scaleCoef
    this.setScale(this.baseScale)

    if (!this.scene.anims.exists(PHYSIC.RIP.animations[0])) {
      this.scene.anims.create({
        key: PHYSIC.RIP.animations[0],
        frames: this.scene.anims.generateFrameNumbers(PHYSIC.RIP.sprites[0], { start: 0, end: -1 }),
        frameRate: 15,
        repeat: -1,
      })
    }

    this.positionCoef = 3

    this.play(PHYSIC.RIP.animations[0])
  }

  jump() {
    this.setScale(this.baseScale * this.gameState.maxRIPScale)
    this.body.isCircle = true
    this.body.setAllowGravity(false)
    this.body.setCircle(80, 45, 45)
    const tempHeight = document.body.offsetHeight

    const bodyX = document.body.offsetWidth / 2,
      bodyY = tempHeight / 2 - tempHeight / this.positionCoef

    const distance = Phaser.Math.Distance.BetweenPoints({ x: bodyX, y: bodyY }, { x: this.x, y: this.y })

    const dx = bodyX - this.x
    const dy = bodyY - this.y

    const normalizedDx = dx / distance
    const normalizedDy = dy / distance

    this.body.setVelocity(normalizedDx * 150, normalizedDy * 150)

    this.body.setAngularVelocity(Phaser.Math.Between(-PHYSIC.RIP.radius, PHYSIC.RIP.radius))
  }

  setDestroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.setTexture(PHYSIC.RIP.sprites[1])

    if (!this.scene.anims.exists(PHYSIC.RIP.animations[1])) {
      this.scene.anims.create({
        key: PHYSIC.RIP.animations[1],
        frames: this.scene.anims.generateFrameNumbers(PHYSIC.RIP.sprites[1], { start: 0, end: -1 }),
        frameRate: 25,
        repeat: -1,
      })
    }

    this.anims.stop()
    this.play(PHYSIC.RIP.animations[1])
  }

  destroyHole(delta, planets, state) {
    if (this.scale < 2 * this.gameState.scaleCoef && planets > 0) this.scale += 0.005 * delta
    if (this.scale > 0 && planets === 0) this.scale -= 0.005 * delta
    if (this.scale <= 0) {
      this.alpha = 0
      state.gameOver()
    }
  }
}
