import { gameState } from '@/game/game/state/state'
import { game, gameUI } from '@/game/main'
import { ui } from '@/game/ui/ui'
import { SCENE } from '@/game/utils/constants'

export class AboutGameUI {
  private aboutGame = document.querySelector('.about-game')
  private aboutGameBtns = document.querySelectorAll('.about-game__btns')

  constructor() {
    this.aboutGameBtns.forEach(elem =>
      elem.addEventListener('click', () => {
        this.hideUI()

        gameUI.showUI()
        ui.uiPointerNoneAdd()

        if (
          gameState.isGetBonus
        ) {
          gameUI.setAllBonusItem()
        }

        game.scene.start(SCENE.SPACE)
      })
    )
  }

  hideUI() {
    this.aboutGame?.classList.remove('show')
  }

  showUI() {
    localStorage.setItem('firstTry', '1')
    this.aboutGame?.classList.add('show')
  }
}
