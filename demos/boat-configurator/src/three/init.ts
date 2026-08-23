import { boat } from '@/db/boat'
import { BoatApplication } from '@/three/models/boat-configurator/index.ts'
import EventEmitter from '@/three/utils/EventEmitter'

/**
 * Boots the THREE application and hands it back.
 *
 * `onProgress` is new: the original swallowed the loader's progress events in an empty
 * subscriber, so the UI could only show a spinner. The models are Draco-compressed but
 * still several megabytes, which is long enough on a phone that a bare spinner reads
 * as a hang.
 */
export default async function init(
	canvas: HTMLCanvasElement | null,
	canvasContainer: HTMLDivElement | null,
	onProgress?: (value: number) => void
) {
	if (!canvas || !canvasContainer) {
		throw Error('BOAT_DEBUG init: canvas or container missing')
	}

	const eventEmitter = new EventEmitter()
	const threejsApp = new BoatApplication(eventEmitter)

	threejsApp.build(canvas, canvasContainer)
	threejsApp.mount()

	eventEmitter.subscribe('loadedProgress', (value: number) => {
		onProgress?.(value)
	})

	await threejsApp.initGLTFLoader()

	boat.current = threejsApp
	return threejsApp
}
