import { useEffect } from 'react'

import { boat, colourOptions, engineOptions, upholsteryOptions } from '@/db/boat'
import { useAppDispatch, useAppSelector } from '@/hooks/useTypedRedux'
import { configuratorActions } from '@/store/configurator/configurator.slice'

import './ControlPanel.scss'

/**
 * Turns store state into scene mutations.
 *
 * Every effect below is guarded on `status === 'ready'` for the same reason: the
 * configurator's setters walk `scene.traverse` and silently no-op before the model
 * exists, so firing them early looks like the control is broken rather than early.
 */
const ControlPanel = () => {
	const dispatch = useAppDispatch()
	const { status, engineId, upholsteryId, hullColourId, interiorColourId } = useAppSelector(
		(state) => state.configurator
	)

	const ready = status === 'ready'

	useEffect(() => {
		if (!ready) return
		const engine = engineOptions.find((item) => item.id === engineId)
		// setEngine('') removes the current engine and adds nothing back, which is what
		// the "No engine" option should do.
		void boat.current?.setEngine(engine?.path ?? '')
	}, [ready, engineId])

	useEffect(() => {
		if (!ready) return
		const material = upholsteryOptions.find((item) => item.id === upholsteryId)
		const colour = colourOptions.find((item) => item.id === interiorColourId)
		if (!material || !colour) return

		boat.current?.setModelTexture({
			objName: 'inner-carpet',
			texture: material.texture,
			color: colour.value
		})
	}, [ready, upholsteryId, interiorColourId])

	useEffect(() => {
		if (!ready) return
		const colour = colourOptions.find((item) => item.id === hullColourId)
		if (colour) boat.current?.setColor(boat.parts.board, colour.value)
	}, [ready, hullColourId])

	return (
		<aside className='panel' aria-label='Boat configuration'>
			<h1 className='panel__title'>Boat Configurator</h1>
			<p className='panel__subtitle'>
				Drag to orbit, scroll to zoom. Options are local to this build.
			</p>

			<div className='panel__group'>
				<label className='panel__label' htmlFor='engine-select'>
					Outboard engine
				</label>
				<select
					id='engine-select'
					className='panel__select'
					value={engineId}
					disabled={!ready}
					onChange={(event) => dispatch(configuratorActions.setEngine(event.target.value))}
				>
					{engineOptions.map((option) => (
						<option key={option.id} value={option.id}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			<div className='panel__group'>
				<span className='panel__label'>Upholstery</span>
				<div className='panel__chips'>
					{upholsteryOptions.map((option) => (
						<button
							key={option.id}
							type='button'
							className={`panel__chip${option.id === upholsteryId ? ' is-active' : ''}`}
							disabled={!ready}
							onClick={() => dispatch(configuratorActions.setUpholstery(option.id))}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			<div className='panel__group'>
				<span className='panel__label'>Interior colour</span>
				<div className='panel__swatches'>
					{colourOptions.map((option) => (
						<button
							key={option.id}
							type='button'
							title={option.label}
							aria-label={option.label}
							aria-pressed={option.id === interiorColourId}
							className={`panel__swatch${option.id === interiorColourId ? ' is-active' : ''}`}
							style={{ background: option.value }}
							disabled={!ready}
							onClick={() => dispatch(configuratorActions.setInteriorColour(option.id))}
						/>
					))}
				</div>
			</div>

			<div className='panel__group'>
				<span className='panel__label'>Hull colour</span>
				<div className='panel__swatches'>
					{colourOptions.map((option) => (
						<button
							key={option.id}
							type='button'
							title={option.label}
							aria-label={option.label}
							aria-pressed={option.id === hullColourId}
							className={`panel__swatch${option.id === hullColourId ? ' is-active' : ''}`}
							style={{ background: option.value }}
							disabled={!ready}
							onClick={() => dispatch(configuratorActions.setHullColour(option.id))}
						/>
					))}
				</div>
			</div>

			<div className='panel__actions'>
				<button
					type='button'
					className='panel__btn'
					disabled={!ready}
					onClick={() => boat.current?.moveCameraToConsole()}
				>
					Console view
				</button>
				<button
					type='button'
					className='panel__btn'
					disabled={!ready}
					onClick={() => boat.current?.moveCameraToBoat()}
				>
					Full view
				</button>
			</div>

			<div className='panel__actions'>
				<button
					type='button'
					className='panel__btn'
					disabled={!ready}
					onClick={() => dispatch(configuratorActions.reset())}
				>
					Reset
				</button>
				<button type='button' className='panel__btn' data-demo-disabled aria-disabled='true'>
					Request a quote
				</button>
			</div>

			<p className='panel__note'>
				“Request a quote” posted the configuration to a backend and returned a PDF. There
				is no backend in this build, so the button is disabled rather than removed.
			</p>
		</aside>
	)
}

export default ControlPanel
