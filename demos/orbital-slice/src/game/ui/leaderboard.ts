export class LeaderboardPreGameUI {
  private leaderboardPreGame: HTMLElement | null = document.querySelector('.leaderboard__pre-game')
  private preloader: HTMLElement | null = document.querySelector('.preload')
  private play: HTMLElement | null = document.querySelector('.play')
  private attemptsBtn: HTMLElement | null = document.querySelector('.attempts-btn')
  private isShowLeaderboard: boolean = false

  constructor() {}

  hideUI() {
    this.leaderboardPreGame?.classList.remove('show')
    this.preloader?.classList.add('show')
    this.play?.classList.add('show')
    this.attemptsBtn?.classList.add('show')
  }

  showUI() {
    this.leaderboardPreGame?.classList.add('show')
    this.preloader?.classList.remove('show')
    this.play?.classList.remove('show')
    this.attemptsBtn?.classList.remove('show')
  }

  setIsShowLeaderboard(isShowLeaderboard: boolean) {
    this.isShowLeaderboard = isShowLeaderboard
  }

  getIsShowLeaderboard() {
    return this.isShowLeaderboard
  }
}
