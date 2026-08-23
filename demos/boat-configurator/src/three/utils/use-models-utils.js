import * as THREE from 'three'

export default function useModelsUtils() {
	const time = new THREE.Clock()

	function disposeSceneData(ctx) {
		if (!ctx.renderer) return

		while (ctx.scene && ctx.scene.children.length) {
			const child = ctx.scene.children[0]
			child.parent.remove(child)

			if (child instanceof THREE.Mesh) {
				child.geometry.dispose()
				child.material.dispose()
			}
		}

		ctx.renderer.instance.dispose()
		ctx.renderer.instance.render(ctx.scene, ctx.camera.instance)
		THREE.Cache.remove()
		ctx.mixer = null

		if (ctx.observer) {
			ctx.observer.disconnect()
			ctx.observer = null
		}

		if (ctx.scene) {
			ctx.scene.clear()
		}

		ctx.sizes.unsubscribe('resize', () => {
			ctx.resize()
		})
	}

	function setAnimation(ctx) {
		const delta = time.getDelta()

		if (ctx.camera && ctx.renderer) {
			ctx.camera.update(delta)
			ctx.renderer.update(delta)
		}

		if (ctx.mixer) {
			ctx.mixer.update(delta)
		}
	}

	return {
		disposeSceneData,
		setAnimation
	}
}
