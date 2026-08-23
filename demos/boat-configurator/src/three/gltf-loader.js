import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { LoadingManager } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

// const manager = new LoadingManager();
const dracoLoader = new DRACOLoader()

// Vendored under public/draco/ rather than fetched from gstatic. The models are
// Draco-compressed, so this decoder is load-bearing: without it nothing renders at all,
// and a demo should not depend on a Google CDN to draw its own geometry.
// Relative path, so it resolves under /demos/<slug>/ as well as at a root deploy.
dracoLoader.setDecoderPath('./draco/')

// 'js' rather than the wasm build: the wasm wrapper needs the decoder and the .wasm to
// agree on version, and the js decoder has no such coupling. Costs ~100ms on first load.
dracoLoader.setDecoderConfig({ type: 'js' })

export default class ModelLoader {
    constructor(url, application) {
        this.url = url
        this.application = application
    }

    async initGLTFLoader(url) {
        const loadingManager = new LoadingManager(
            () => {},

            // progress
            (item, loaded, total) => {
                if (!this.application) return
                const progress = loaded / total
                this.application.eventEmitter.notify('loadedProgress', progress)
            }
        )

        const loader = new GLTFLoader(loadingManager)

        loader.setDRACOLoader(dracoLoader)

        try {
            const obj = await loader.loadAsync(url || this.url)
            if (this.application) {
                this.application.eventEmitter.notify('setLoadingFinished')
            }
            return obj
        } catch (e) {
            // console.error(e.message)
        }
    }
}
