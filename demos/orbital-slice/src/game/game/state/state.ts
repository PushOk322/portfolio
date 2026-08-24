// @ts-nocheck
import { game, gameOverUI, gameUI } from '@/game/main'
import { AUDIO, LASER, MODE, SCENE } from '@/game/utils/constants'
import secondsToString from '@/game/utils/seconds-to-string'
import { gameApi } from '@/services/api/game.api'
import { ILeaderboard, ITopLeaderboard } from '@/types/services.types'

export default class State {
  private defaultSeconds: number = 60
  private score: number = 0
  private life: number = 3
  private cutAsteroids: number = 0
  private maxCutAsteroids: number = 1
  private sound: boolean = !!localStorage.getItem('sound')
  private music: boolean = !!localStorage.getItem('sound')
  private menuScene: Phaser.Scene | null = null
  bonusArray: number[] = [1, 2, 3, 4, 5]
  private bonusArrayStep: number = 0
  gameStart: Date = new Date()
  gameEnd: Date = new Date()
  isGetBonus: boolean = false
  bonusScore: number = 0
  isToday: boolean = false
  allPauseTime: number = 0
  private timeoutComplications: ReturnType<typeof setTimeout> | undefined
  private maxRIPComplications: ReturnType<typeof setTimeout> | undefined
  private steroidsComplications: ReturnType<typeof setTimeout> | undefined
  private gameTimeInterval: ReturnType<typeof setInterval> | undefined
  attractionForce: number = 450
  speedForce: number = 1
  planets = [
    {
      planet_id: 1,
      count: 0,
    },
    {
      planet_id: 2,
      count: 0,
    },
    {
      planet_id: 3,
      count: 0,
    },
    {
      planet_id: 4,
      count: 0,
    },
    {
      planet_id: 5,
      count: 0,
    },
    {
      planet_id: 6,
      count: 0,
    },
    {
      planet_id: 7,
      count: 0,
    },
  ]

  handleLeaderboard?: () => void

  sword = LASER.PURPLE
  mode: MODE = MODE.CLASSIC
  secondsCount: number = this.defaultSeconds
  scaleCoef: number = 1
  maxSteroids: number = 1
  maxRIPScale: number = 1
  gameTime: number = 0
  leaderboard: ILeaderboard = { daily_leaderboard: [], all_time_leaderboard: [] }
  topLeaderboard: ITopLeaderboard = { leaderboard: [], current_user: {} }
  attemptsQuantity: number
  freeAttemptsQuantity: number
  paidAttemptsQuantity: number
  unlimitedAttempts: boolean

  static instance: State

  constructor() {
    if (State.instance) {
      return State.instance
    }

    State.instance = this
  }

  setSound(value: boolean): void {
    this.sound = value
  }

  setMusic(value: boolean): void {
    this.music = value
    // if (value) this.musicPlay(this.menuScene as Phaser.Scene, AUDIO.MENU_MUSIC)
    // else this.musicStop(this.menuScene as Phaser.Scene, AUDIO.MENU_MUSIC)
  }

  getSound(): boolean {
    return this.sound
  }
  getMusic(): boolean {
    return this.music
  }

  setMenuScene(scene: Phaser.Scene): void {
    this.menuScene = scene
  }

  musicPlay(scene: Phaser.Scene, key: string) {
    let music = null

    if (!scene.sound.get(key)) music = scene.sound.add(key, { volume: 0.2 })
    else music = scene.sound.get(key)

    if (music && !music.isPlaying) music.play({ loop: true })
  }

  musicStop(scene: Phaser.Scene, key: string) {
    const music = scene.sound.get(key) ?? null
    if (music && music.isPlaying) music.stop()
  }

  getScore = (): number => this.score
  getLife = (): number => this.life

  addToScore(score: number): void {
    this.score += score

    gameUI.setScoreValue(this.score)
  }

  minusLife(): void {
    this.life--

    gameUI.setLife(this.life)

    if (!this.life) {
      this.life = 3
      this.gameOver()
    }
  }

  asteroidCut() {
    this.cutAsteroids++

    if (this.cutAsteroids === this.maxCutAsteroids) {
      this.minusLife()
      this.cutAsteroids = 0
    }
  }

  setGameTime(): void {
    this.gameTimeInterval = setInterval(() => {
      if (!gameUI.isPause) {
        this.gameTime += 1
      }
    }, 1000)
  }

  getGameTime = (): string => {
    return this.gameTime
  }

  gameOver(): void {
    gameUI.hideUI()
    gameUI.refreshLife()
    gameOverUI.showGameOverUI()
    gameOverUI.setScore(this.getScore())
    gameOverUI.setTime(secondsToString(this.getGameTime()))
    game.scene.getScene(SCENE.SPACE).scene.stop()
  }

  gameRefresh(): void {
    this.reset()
    game.scene.stop(SCENE.SPACE)
    game.scene.start(SCENE.SPACE)
  }

  gamePause(): void {
    game.scene.pause(SCENE.SPACE)
  }

  gameContinue(): void {
    game.scene.resume(SCENE.SPACE)
  }

  refreshSeconds() {
    this.secondsCount = this.defaultSeconds
  }

  setHandleLeaderboard(func): void {
    this.handleLeaderboard = func
  }

  reset(): void {
    this.score = 0
    this.life = 3
    this.bonusArrayStep = 0
    this.gameStart = new Date()
    this.planets.forEach(elem => (elem.count = 0))
    this.attractionForce = 450
    this.speedForce = 1
    this.maxSteroids = 1
    this.maxRIPScale = 1
    this.gameTime = 0
    this.allPauseTime = 0
    this.handleLeaderboard && this.handleLeaderboard()
    this.setMusic(null)
    gameUI.setScoreValue(this.score)
    clearInterval(this.timeoutComplications)
    clearInterval(this.maxRIPComplications)
    clearInterval(this.steroidsComplications)
    clearInterval(this.gameTimeInterval)
  }

  setScaleCoef(value: number) {
    this.scaleCoef = value
  }

  checkBonusArray(id) {
    if (!this.isGetBonus) {
      if (this.bonusArrayStep !== 5) {
        if (this.bonusArray[this.bonusArrayStep] === id) {
          gameUI.setBonusItem(this.bonusArrayStep, id - 1)
          this.bonusArrayStep++

          if (this.bonusArrayStep === 5) {
            gameUI.showBonusInfo()
            this.isGetBonus = true
          }
        } else {
          this.bonusArrayStep = 0
          gameUI.resetBonusItem()
        }
      }
    }
  }

  setComplications() {
    setTimeout(() => {
      this.timeoutComplications = setInterval(() => {
        if (!gameUI.isPause) {
          if (this.attractionForce <= 10000) {
            this.attractionForce += 0.1
          }
          if (this.speedForce <= 2.4) {
            this.speedForce += 0.1
          }

          if (this.attractionForce >= 10000 && this.speedForce >= 2.4) {
            clearInterval(this.timeoutComplications)
          }
        }
      }, 10000)

      this.maxRIPComplications = setInterval(() => {
        if (!gameUI.isPause) {
          this.maxRIPScale += 0.2

          if (this.maxRIPScale >= 2.8) {
            clearInterval(this.maxRIPComplications)
          }
        }
      }, 30000)

      this.steroidsComplications = setInterval(() => {
        if (!gameUI.isPause) {
          this.maxSteroids += 1

          if (this.maxSteroids >= 4) {
            clearInterval(this.steroidsComplications)
          }
        }
      }, 30000)
    }, 60000)
  }

  async setLeaderboard(): Promise<void> {
    this.leaderboard = (await gameApi.getUserLeaderboard({ is_daily: false, offset: 0, limit: 10 })).data
  }

  getLeaderboard(): ILeaderboard {
    return this.leaderboard
  }

  async setTopLeaderboard(): Promise<void> {
    const leaderboardTopData = (await gameApi.getUserTopLeaderboard()).data
    this.topLeaderboard = leaderboardTopData
    this.attemptsQuantity =
      leaderboardTopData.current_user.available_free_attempts + leaderboardTopData.current_user.available_attempts
    this.unlimitedAttempts = leaderboardTopData.current_user.is_unlimited_attempts
    this.freeAttemptsQuantity = leaderboardTopData.current_user.available_free_attempts
    this.paidAttemptsQuantity = leaderboardTopData.current_user.available_attempts
  }

  getTopLeaderboard(): ITopLeaderboard {
    return this.topLeaderboard
  }
}

export const gameState = new State()
