// @ts-nocheck

import Planet from '@/game/game/entities/planet'
import { State } from '@/game/game/state'
import { ui } from '@/game/ui/ui'
import { ANIM, AUDIO, LASER, PHYSIC, SCENE, SPRITE } from '@/game/utils/constants'
import Laser from '../entities/laser'
import SpaceGenerator from '../generator/space-generator'
import { gameUI } from '@/game/main'
import secondsToString from '@/game/utils/seconds-to-string'

export class Space extends Phaser.Scene {
  planets: Phaser.Physics.Arcade.Group | undefined
  steroid: Phaser.GameObjects.Group | undefined
  rip: Phaser.GameObjects.Group | undefined
  point: Phaser.GameObjects.Ellipse | undefined
  generator: SpaceGenerator
  isDown: boolean = false

  private gameState: State
  private multiper: Planet[]
  private timeout: ReturnType<typeof setTimeout> | undefined
  private timeoutAnimation: ReturnType<typeof setTimeout> | undefined

  constructor() {
    super(SCENE.SPACE)

    this.gameState = new State()
    this.multiper = []

    const scaleCoef = 0.5
    this.maxBlackHoleDistance = 300
    this.planetToHoleSpeed = 50
    this.asteroidSpeed = 10

    this.gameState.setScaleCoef(scaleCoef)
    this.gameState.gameTime = 0
    clearInterval(this.gameState.timeoutComplications)
    clearInterval(this.gameState.maxRIPComplications)
    clearInterval(this.gameState.steroidsComplications)
    clearInterval(this.gameState.gameTimeInterval)
  }

  create() {
    this.planets = this.physics.add.group()
    this.steroid = this.physics.add.group()
    this.rip = this.physics.add.group()

    this.multiper = []

    this.generator = new SpaceGenerator(this)

    //---------------MUSIC----------------------------------------
    if (this.gameState.getMusic()) {
      this.gameState.musicStop(this, AUDIO.MENU_MUSIC)
      this.gameState.musicPlay(this, AUDIO.GAME_MUSIC)
    }
    //-------------------------------------------------------------

    this.laser = new Laser(this, this.gameState.sword.LASER)
    this.laser.collisionPoint.setActive(false)

    if (this.anims.get(ANIM.SLICE)) this.anims.remove(ANIM.SLICE)
    if (this.anims.get(ANIM.EXPLOSION)) this.anims.remove(ANIM.EXPLOSION)

    this.anims.create({
      key: ANIM.SLICE,
      frames: this.anims.generateFrameNumbers(this.gameState.sword.SLICE, {
        start: 0,
        end: 9,
      }),
      frameRate: 35,
      repeat: 0,
    })
    this.anims.create({
      key: ANIM.EXPLOSION,
      frames: this.anims.generateFrameNumbers(this.gameState.sword.EXPLOSION, {
        start: 0,
        end: 5,
      }),
      frameRate: 20,
      repeat: 0,
    })

    this.addOverlap()
  }

  addOverlap() {
    this.physics.add.collider(this.planets ?? [], this.steroid ?? [])

    this.physics.add.collider(this.planets ?? [], this.planets ?? [])

    this.physics.add.collider(this.steroid ?? [], this.steroid ?? [])

    this.physics.add.overlap(
      this.planets ?? [],
      this.point ?? [],
      (obj1, obj2) => {
        const distance = Phaser.Math.Distance.BetweenPoints({ x: obj1.x, y: obj1.y }, { x: obj2.x, y: obj2.y })

        if (distance < 100) {
          clearTimeout(this.timeout)

          const angle = Phaser.Math.Angle.BetweenPoints({ x: obj2.x, y: obj2.y }, { x: obj1.x, y: obj1.y })

          this.timeout = setTimeout(() => {
            if (this.multiper.length > 2) {
              this.gameState.addToScore(this.multiper.length)
            }
            this.multiper = []
          }, 100)

          this.gameState.checkBonusArray(obj2.id + 1)

          const indexPlanet = this.gameState.planets.findIndex(elem => elem.planet_id === obj2.id + 1)

          this.gameState.planets[indexPlanet].count++

          obj2.divide(angle)

          if (this.gameState.getSound()) {
            const sound = this.sound.add(AUDIO.EXPLOSION, { volume: 0.3 })
            sound.play()
          }

          const explosion = this.add.sprite(obj2.x, obj2.y, this.gameState.sword.EXPLOSION)
          const slice = this.add.sprite(obj2.x, obj2.y, this.gameState.sword.SLICE)
          slice.setRotation(angle)
          slice.setScale(1 * this.gameState.scaleCoef, 1.5 * this.gameState.scaleCoef)
          explosion.setScale(2.7 * this.gameState.scaleCoef)
          // exp.setTint(0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00);
          explosion.anims.play(ANIM.EXPLOSION)
          slice.anims.play(ANIM.SLICE)

          this.multiper.push(obj2)

          this.generator.destroyPlanets(obj2)

          slice.on(
            'animationcomplete',
            () => {
              slice.destroy()
            },
            this
          )
          explosion.on(
            'animationcomplete',
            () => {
              explosion.destroy()
            },
            this
          )
        }
      },
      undefined,
      this
    )

    this.physics.add.overlap(
      this.steroid ?? [],
      this.point ?? [],
      (obj1, obj2) => {
        // стероид
        if (obj2.isDestroyed) return
        obj2.isDestroyed = true

        if (this.gameState.getSound()) {
          const sound = this.sound.add(AUDIO.ASTEROID, { volume: 0.3 })
          sound.play()
        }

        const angle = Phaser.Math.Angle.BetweenPoints({ x: obj2.x, y: obj2.y }, { x: obj1.x, y: obj1.y })
        const dist = Phaser.Math.Distance.BetweenPoints({ x: obj2.x, y: obj2.y }, { x: obj1.x, y: obj1.y })

        const deg = Phaser.Math.RadToDeg(angle)
        let startTan, endTan

        if (deg < 0) {
          startTan = Math.PI * 2 + angle

          endTan = startTan - Math.PI
        } else {
          startTan = angle

          endTan = startTan + Math.PI
        }

        const x = Math.cos(endTan) * dist,
          y = Math.sin(endTan) * dist

        const normalizedDx = x / dist
        const normalizedDy = y / dist

        obj2.body.setVelocity(normalizedDx * this.asteroidSpeed * 100, normalizedDy * this.asteroidSpeed * 100)

        this.gameState.asteroidCut()

        const canvas = document.querySelector('canvas')

        clearTimeout(this.timeoutAnimation)
        canvas?.classList.remove('animation')

        canvas?.classList.add('animation')

        this.timeoutAnimation = setTimeout(() => {
          canvas?.classList.remove('animation')
        }, 1000)
      },
      undefined,
      this
    )

    this.physics.add.overlap(
      this.rip ?? [],
      this.point ?? [],
      (obj1, obj2) => {
        // Сопля
        // this.gameState.gameOver();
        if (this.gameState.getSound()) {
          const sound = this.sound.add(AUDIO.BLACK_HOLE, { volume: 0.3 })
          sound.play()
        }
        obj2?.setDestroy()
      },
      undefined,
      this
    )

    this.physics.add.overlap(
      this.rip ?? [],
      this.planets ?? [],
      (obj1, obj2) => {
        if (obj1.x > 0) {
          this.gameState.addToScore(-obj2.point)
          gameUI.showAddingScore(-obj2.point, { x: obj2.x, y: obj2.y })

          const indexPlanet = this.gameState.planets.findIndex(elem => elem.planet_id === obj2.id + 1)
          this.gameState.minusLife()
          this.gameState.planets[indexPlanet].count--
          this.generator.destroyPlanets(obj2)
        }
      },
      undefined,
      this
    )
  }

  update(time, delta) {
    // stats.begin();
    this.laser.update(delta)
    gameUI.setGameTimer(secondsToString(this.gameState.getGameTime()))

    if (this.rip?.getChildren().length) {
      const rip = this.rip.getChildren()[0]

      if (rip.destroyed) {
        rip.destroyHole(delta, this.planets?.getChildren().length, this.gameState)
        this.generator.setStop(true)

        rip.body.setVelocity(0, 0)
        this.point?.setActive(false)

        this.planets?.getChildren().forEach(elem => {
          const distance = Phaser.Math.Distance.BetweenPoints({ x: elem.x, y: elem.y }, { x: rip.x, y: rip.y })
          const dx = rip.x - elem.x
          const dy = rip.y - elem.y

          const normalizedDx = dx / distance
          const normalizedDy = dy / distance

          elem.body.setVelocity(
            normalizedDx * this.planetToHoleSpeed * delta,
            normalizedDy * this.planetToHoleSpeed * delta
          )
        })
      }

      this.planets?.getChildren().forEach(elem => {
        const distance = Phaser.Math.Distance.BetweenPoints({ x: elem.x, y: elem.y }, { x: rip.x, y: rip.y })

        const dx = rip.x - elem.x
        const dy = rip.y - elem.y

        const normalizedDx = dx / distance
        const normalizedDy = dy / distance

        if (distance <= this.maxBlackHoleDistance) {
          elem.scale = 0.25 + (elem.baseScale - 0.25) * (distance / this.maxBlackHoleDistance)
        }

        elem.body.velocity.x += (normalizedDx * this.gameState.attractionForce * delta) / 2000
        elem.body.velocity.y += (normalizedDy * this.gameState.attractionForce * delta) / 2000
      })
    }

    this.generator.checkBoundsRip()
    this.generator.checkBoundsPlanet()
    this.generator.checkBoundsSteroid()

    this.planets?.getChildren().forEach(elem => elem.updateGravity())
  }

  setRestart() {
    this.scene.restart()
  }
}
