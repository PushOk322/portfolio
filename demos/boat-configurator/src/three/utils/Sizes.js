import EventEmitter from './EventEmitter.ts'

export default class Sizes extends EventEmitter {
  constructor(canvasContainer) {
    super()
    this.width = canvasContainer.offsetWidth
    this.height = canvasContainer.offsetHeight
    // this.pixelRatio = Math.min(window.devicePixelRatio, 2)
    this.pixelRatio = 2
    this.aspect = this.width / this.height

    window.addEventListener('resize', () => {
      this.width = canvasContainer.offsetWidth
      this.height = canvasContainer.offsetHeight
      // this.pixelRatio = Math.min(window.devicePixelRatio, 2)
      this.pixelRatio = 2
      this.aspect = this.width / this.height

      this.notify('resize')
    })
  }
}
