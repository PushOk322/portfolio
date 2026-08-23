import { useEffect, useRef } from 'react'

import { boat } from '@/db/boat'
import { useAppDispatch, useAppSelector } from '@/hooks/useTypedRedux'
import { configuratorActions } from '@/store/configurator/configurator.slice'
import init from '@/three/init'
import { BoatApplication } from '@/three/models/boat-configurator'

import './Canvas.scss'

/**
 * Owns the THREE lifecycle and nothing else.
 *
 * The scene instance lives in a ref, not in Redux: it holds WebGL resources and
 * mutates every frame, so putting it in the store would mean either a
 * non-serialisable value in state or a re-render per frame. The store holds the
 * *choice*; this component turns a choice into a scene mutation. That split is the
 * whole reason the 3D layer is framework-agnostic — `BoatApplication` has no idea
 * React exists.
 */
const Canvas = () => {
	const canvas = useRef<HTMLCanvasElement>(null)
	const container = useRef<HTMLDivElement>(null)
	const instance = useRef<BoatApplication | null>(null)

	const dispatch = useAppDispatch()
	const { status, progress } = useAppSelector((state) => state.configurator)

	useEffect(() => {
		if (!canvas.current || !container.current) return
		// StrictMode double-invokes effects in dev; the app is a singleton, so a second
		// init would hand back the same instance and re-add the model.
		if (instance.current) return

		dispatch(configuratorActions.setStatus('loading'))

		init(canvas.current, container.current, (value) => {
			dispatch(configuratorActions.setProgress(value))
		})
			.then((app) => {
				instance.current = app
				dispatch(configuratorActions.setStatus('ready'))
			})
			.catch((error) => {
				console.error('BOAT_DEBUG init failed:', error)
				dispatch(configuratorActions.setStatus('error'))
			})
	}, [dispatch])

	// The scene reads its own size from the container, so a resize is just a nudge.
	useEffect(() => {
		const onResize = () => window.dispatchEvent(new Event('resize'))
		window.addEventListener('orientationchange', onResize)
		return () => window.removeEventListener('orientationchange', onResize)
	}, [])

	useEffect(() => {
		return () => {
			boat.current?.clearScene()
			boat.current = null
			instance.current = null
		}
	}, [])

	return (
		<div ref={container} className='canvas-container'>
			<canvas id='canvas' className='canvas' ref={canvas} />

			{status !== 'ready' && (
				<div className='canvas-loader' role='status' aria-live='polite'>
					{status === 'error' ? (
						<p className='canvas-loader__text'>
							The model could not be loaded. See the browser console.
						</p>
					) : (
						<>
							<div className='canvas-loader__bar'>
								<div
									className='canvas-loader__fill'
									style={{ width: `${Math.round(progress * 100)}%` }}
								/>
							</div>
							<p className='canvas-loader__text'>
								Loading model… {Math.round(progress * 100)}%
							</p>
						</>
					)}
				</div>
			)}
		</div>
	)
}

export default Canvas
