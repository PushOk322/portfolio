export default class ThreejsApplication {
    constructor() {
        this.isMounted = false;
    }

    /**
     * Makes all preparation before mount
     * @param {Node} canvas
     * @abstract
     */
    build(canvas) {
        if(this) {
            throw new Error('method not implemented');
        }
    }

    /**
     * Unlocks and start animation loop
     */
    mount() {
        this.isMounted = true;
        this.startAnimationLoop();
    }

    /**
     * Starts animation loop if application was mounted
     * @private
     */
    startAnimationLoop() {
        if (this.isMounted !== true) {
            return;
        }

        this.animateFrame();

        requestAnimationFrame(() => this.startAnimationLoop());
    }

    /**
     * Animates one frame
     * @private
     * @abstract
     */
    animateFrame() {
        throw new Error('method not implemented');
    }

    /**
     * Locks any further animations
     */
    unmount() {
        this.isMounted = false;
    }
}