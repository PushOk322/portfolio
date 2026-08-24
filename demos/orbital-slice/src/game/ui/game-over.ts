// @ts-nocheck

import { gameState } from '@/game/game/state/state'
import { game, gameUI, gameOverUI, startGame } from '@/game/main'
import { ui, startUI } from '@/game/ui/ui'
import { AUDIO, SCENE } from '@/game/utils/constants'
import { gameApi, recordBestScore } from '@/services/api/game.api'

function debounce(func, delay = 500) {
  let timer
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => func.apply(this, args), delay)
  }
}

export class GameOver {
  private gameOver = document.querySelector('.game-over')
  private score = document.querySelectorAll('.game-score span')
  private gameTime = document.querySelectorAll('.game-time span')
  private gameOverBtn = document.querySelector('.game-over__btn')

  private gameSuccess = document.querySelector('.game-success')
  private gameSuccessBtnRestart = document.querySelector('.game-success__restart')
  private gameSuccessBtnBack = document.querySelector('.game-success__back')
  private isShowLeaderboard = false

  constructor() {
    this.gameOverBtn?.addEventListener('click', async () => {
      this.hideGameOverUI()
      this.showGameSuccessUI()
    })

    this.gameSuccessBtnRestart?.addEventListener(
      'click',
      debounce(async () => {
        try {
          if (!gameState.unlimitedAttempts && gameState.attemptsQuantity <= 0) {
            // Ensure `ui.hidePreloaderText()` runs separately after a small delay

            gameOverUI.hideGameSuccessUI()
            startUI()
            game.scene.getScenes().forEach(elem => {
              game.scene.stop(elem.scene.key)
            })
            gameState.reset()
            game.scene.start(SCENE.MENU)

            await gameState.setTopLeaderboard().catch(err => {
              console.error('Failed to update leaderboard:', err)
            })

            setTimeout(() => {
              ui.hidePreloaderText()
            }, 100)
            return
          }

          const response = await gameApi.sendStart()

          gameState.gameRefresh()
          this.hideGameSuccessUI()
          gameUI.showUI()
          ui.uiPointerNoneAdd()

          // Step 4: Update leaderboard attempts in the background (no delay for user)
          gameState.setTopLeaderboard().catch(err => {
            console.error('Failed to update leaderboard:', err)
          })
        } catch (error) {
          gameOverUI.hideGameSuccessUI()
          game.scene.getScenes().forEach(elem => {
            game.scene.stop(elem.scene.key)
          })
          gameState.reset()
          game.scene.start(SCENE.MENU)
          startUI()

          await gameState.setTopLeaderboard().catch(err => {
            console.error('Failed to update leaderboard:', err)
          })

          setTimeout(() => {
            ui.hidePreloaderText()
          }, 100)
        }
      }, 100)
    )

    this.gameSuccessBtnBack?.addEventListener('click', () => {
      gameState.gameRefresh()
      game.scene.getScene(SCENE.SPACE).sound.stopAll()
    })
  }

  showGameOverUI() {
    this.gameOver?.classList.add('show')
    gameState.gameEnd = new Date()
    ui.uiPointerNoneRemove()
  }

  hideGameOverUI() {
    this.gameOver?.classList.remove('show')
  }

  showGameSuccessUI() {
    this.gameSuccess?.classList.add('show')
    ui.uiPointerNoneRemove()
    this.isShowLeaderboard = true
  }

  hideGameSuccessUI() {
    this.gameSuccess?.classList.remove('show')
    this.isShowLeaderboard = false
  }

  setScore(score: number) {
    // Portfolio build: the backend used to own the personal best. Persist it locally
    // so the "Best" readout means something across runs instead of always reading 0.
    recordBestScore(score)

    if (this.score.length > 0) {
      this.score.forEach(
        elem => (elem.innerHTML = `${score + (gameState.isGetBonus && !gameState.isToday ? gameState.bonusScore : 0)}`)
      )
    }
  }

  setTime(time: string) {
    if (this.gameTime.length > 0) {
      this.gameTime.forEach(elem => (elem.innerHTML = time))
    }
  }

  getIsShow() {
    return this.isShowLeaderboard
  }
}
