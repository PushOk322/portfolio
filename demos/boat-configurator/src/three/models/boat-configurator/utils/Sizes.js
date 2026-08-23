import EventEmitter from "@/three/utils/EventEmitter";

export default class Sizes extends EventEmitter {
    constructor(canvasContainer) {
        super()
        this.canvasContainer = canvasContainer;
        this.width = canvasContainer.offsetWidth;
        this.height = canvasContainer.offsetHeight;
        this.pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.aspect = this.width / this.height

        window.addEventListener('resize', () => {
            this.recalculateSizes()
            this.notify('resize')
        })
    }

    recalculateSizes() {
        this.width = this.canvasContainer.offsetWidth;
        this.height = this.canvasContainer.offsetHeight;
        this.pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.aspect = this.width / this.height
    }
}
