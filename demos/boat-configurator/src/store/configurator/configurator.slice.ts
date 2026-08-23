import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { colourOptions, engineOptions, upholsteryOptions } from '@/db/boat'

/**
 * Configurator state.
 *
 * Production had twelve slices — cart, auth, parts, trailers, tuning, navigation and
 * the rest — most of them wrapping API thunks. With no backend, one slice covers what
 * the 3D scene actually needs. The pattern is unchanged: the store owns the choice,
 * the scene is a side effect of it, and nothing reads state off the THREE objects.
 */

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface IConfiguratorState {
	status: LoadStatus
	/** 0-1, from the GLTF loading manager. */
	progress: number
	engineId: string
	upholsteryId: string
	hullColourId: string
	interiorColourId: string
}

const initialState: IConfiguratorState = {
	status: 'idle',
	progress: 0,
	engineId: engineOptions[0].id,
	upholsteryId: upholsteryOptions[0].id,
	hullColourId: colourOptions[0].id,
	interiorColourId: colourOptions[0].id
}

export const configuratorSlice = createSlice({
	name: 'configurator',
	initialState,
	reducers: {
		setStatus: (state, action: PayloadAction<LoadStatus>) => {
			state.status = action.payload
		},
		setProgress: (state, action: PayloadAction<number>) => {
			state.progress = action.payload
		},
		setEngine: (state, action: PayloadAction<string>) => {
			state.engineId = action.payload
		},
		setUpholstery: (state, action: PayloadAction<string>) => {
			state.upholsteryId = action.payload
		},
		setHullColour: (state, action: PayloadAction<string>) => {
			state.hullColourId = action.payload
		},
		setInteriorColour: (state, action: PayloadAction<string>) => {
			state.interiorColourId = action.payload
		},
		reset: () => initialState
	}
})

export const configuratorActions = configuratorSlice.actions
export default configuratorSlice.reducer
