import { gameState } from '@/game/game/state/state'
import { Utils } from '@/game/ui/utils'
import bonusImg from '@/game/utils/bonusImg'

export class GameUI {
  private root = document.querySelector('.game') as HTMLElement
  // private addScoreLabel = this.root.querySelector('.game-screen__add-score') as HTMLDivElement;
  private scoreValueEls = this.root.querySelectorAll('.game__score span') as NodeListOf<HTMLSpanElement>
  private bestScoreEls = this.root.querySelectorAll('.game__best span') as NodeListOf<HTMLSpanElement>
  private lifeEls = Array.from(this.root.querySelectorAll('.game__life-item')) as Array<HTMLLIElement>
  private isPause = false
  private bonusItems = document.querySelectorAll('.game__bonus-item img')
  private bonusInfo = document.querySelector('.game__bonus-info')
  private bonusPointItem = document.querySelectorAll('.bonus_point_item')
  private gameBonus = document.querySelector('.game__bonus')
  private sound = document.querySelector('.sound') as HTMLDivElement
  private gameTimer = document.querySelector('.game__score .game-time')
  private startPause: Date = new Date()

  //Buttons
  private pauseBtn = document.querySelector('.game__btn-pause') as HTMLButtonElement

  constructor() {
    this.pauseBtn.addEventListener('click', this.handlePauseClick.bind(this))
  }

  getPauseBtn = (): HTMLButtonElement => this.pauseBtn

  showAddingScore(value: number, pos: { x: number; y: number }): void {
    const uiValue = document.createElement('p')
    uiValue.classList.add('add-score')
    uiValue.innerHTML = value < 0 ? value.toString() : `+${value}`
    uiValue.style.top = pos.y + 'px'
    uiValue.style.left = pos.x + 'px'

    this.root.appendChild(uiValue)
    uiValue.classList.add('show')

    setTimeout(() => {
      uiValue.classList.remove('show')

      setTimeout(() => {
        uiValue.remove()
      }, 500)
    }, 1000)
  }

  setScoreValue(value: number): void {
    this.scoreValueEls.forEach(score => {
      score.innerHTML = String(value)
    })

    this.bestScoreEls.forEach(elem => {
      elem.innerHTML = Math.max(+elem.innerHTML, value).toString()
    })
  }

  setBestValue(score: string): void {
    this.bestScoreEls.forEach(elem => {
      elem.innerHTML = score
    })
  }

  setLife(countLife: number): void {
    const currentEl = this.lifeEls[countLife]
    Utils.addClass(currentEl, 'hide')
  }

  refreshLife(): void {
    this.lifeEls.forEach(el => {
      Utils.removeClass(el, 'hide')
    })
  }

  refreshScore() {
    this.scoreValueEls.forEach(score => {
      score.innerHTML = String(0)
    })
  }

  private handlePauseClick(): void {
    this.isPause = !this.isPause

    if (this.isPause) {
      this.startPause = new Date();
      this.pauseBtn.innerHTML = `<img src='/images/game/icons/play.svg' alt='button play' />`
      gameState.gamePause()
      this.sound.classList.add('show')
      this.sound.classList.add('game__sound')
    } else {
      gameState.allPauseTime += new Date().getTime() - this.startPause.getTime();
      console.log(gameState.allPauseTime);
      this.pauseBtn.innerHTML = `<img src='/images/game/icons/pause.svg' alt='pause button' />`
      gameState.gameContinue()
      this.sound.classList.remove('show')
      this.sound.classList.remove('game__sound')
    }
  }

  hideUI() {
    this.root.classList.remove('show')
    this.pauseBtn.classList.remove('show')
  }

  showUI() {
    gameState.gameStart = new Date();
    this.root.classList.add('show')
    this.pauseBtn.classList.add('show')
  }

  setBonusItem(index: number, id: number) {
    this.bonusItems[index].setAttribute('src', bonusImg[id])
  }

  setAllBonusItem() {
    this.gameBonus?.classList.add('active')
    gameState.bonusArray.forEach((elem, index) => {
      this.bonusItems[index].setAttribute('src', bonusImg[elem - 1])
    })
  }

  setBonusPoint(score) {
    this.bonusPointItem.forEach(elem => (elem.textContent = `+ ${score}`))
  }

  resetBonusItem() {
    this.bonusItems.forEach(elem => elem.setAttribute('src', '/images/game/icons/question.svg'))
  }

  showBonusInfo() {
    this.bonusInfo?.classList.add('show')
    this.gameBonus?.classList.add('active')

    setTimeout(() => {
      this.bonusInfo?.classList.remove('show')
    }, 5000)
  }

  setGameTimer(time: string) {
    if (this.gameTimer) this.gameTimer.innerHTML = time
  }
}
