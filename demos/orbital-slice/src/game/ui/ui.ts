// @ts-nocheck

import { gameState } from '@/game/game/state/state'
import { aboutGameUI, game, gameUI } from '@/game/main'
import { AUDIO, SCENE } from '@/game/utils/constants'
import { gameApi } from '@/services/api/game.api'

class UI {
  private ui = document.querySelector('.ui')
  private rootEl = document.getElementById('root') as HTMLDivElement
  private preload = this.rootEl.querySelector('.preload') as HTMLDivElement
  private preloadText = document.querySelector('.preload__text') as HTMLDivElement
  private play = document.querySelector('.play') as HTMLDivElement
  private attemptsBtn = document.querySelector('.attempts-btn') as HTMLDivElement
  private sound = document.querySelector('.sound') as HTMLDivElement
  private soundOn = document.querySelectorAll('.sound__on')
  private soundOff = document.querySelectorAll('.sound__off')

  constructor() {
    this.sound.addEventListener('click', this.handleSoundClick.bind(this))
  }

  setProgress(value: number): void {
    const progress = document.getElementById('load-progress')

    if (progress?.innerHTML) progress.innerHTML = String(Math.round(value))
  }

  showPreload() {
    this.preload.classList.add('show')

    if (gameState.getMusic()) {
      this.soundOn.forEach(elem => elem.classList.add('show'))
      this.soundOff.forEach(elem => elem.classList.remove('show'))
    } else {
      this.soundOn.forEach(elem => elem.classList.remove('show'))
      this.soundOff.forEach(elem => elem.classList.add('show'))
    }
  }

  hidePreloader(): void {
    this.preload.classList.remove('show')
    this.sound.classList.remove('show')
    this.play.classList.remove('show')
    this.attemptsBtn.classList.remove('show')
  }

  hidePreloaderText(): void {
    this.preloadText.style.display = 'none'
    this.play.classList.add('show')
    this.attemptsBtn.classList.add('show')
    this.sound.classList.add('show')
    this.setPreload(false);
    this.play.onpointerup = async () => {
      await gameApi.sendStart()
      this.hidePreloader()
      if (!localStorage.getItem('firstTry')) {
        aboutGameUI.showUI()
      } else {
        gameUI.showUI()
        this.uiPointerNoneAdd()

        if (gameState.isGetBonus) {
          gameUI.setAllBonusItem()
        }

        game.scene.start(SCENE.SPACE)
        gameState.gameStart = new Date()
      }
      // this.uiPointerNoneAdd()
      this.play.onpointerup = null
    }
  }

  private handleSoundClick(): void {
    gameState.setMusic(!gameState.getMusic())
    gameState.setSound(!gameState.getSound())

    if (gameState.getMusic()) {
      localStorage.setItem('sound', '1')
      gameState.musicPlay(game.scene.getScene(SCENE.SPACE), AUDIO.GAME_MUSIC)
      this.soundOn.forEach(elem => elem.classList.add('show'))
      this.soundOff.forEach(elem => elem.classList.remove('show'))
    } else {
      localStorage.setItem('sound', '')
      gameState.musicStop(game.scene.getScene(SCENE.SPACE), AUDIO.GAME_MUSIC)
      this.soundOn.forEach(elem => elem.classList.remove('show'))
      this.soundOff.forEach(elem => elem.classList.add('show'))
    }
  }

  uiPointerNoneAdd() {
    this.ui?.classList.add('pointer-none')
  }
  uiPointerNoneRemove() {
    this.ui?.classList.remove('pointer-none')
  }

  setFuncPreload(func) {
    this.setPreload = func
  }
}

export let ui

export function startUI() {
  ui = new UI()
  ui.showPreload()
}
