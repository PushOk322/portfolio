import { configureStore } from '@reduxjs/toolkit'

import configuratorReducer from './configurator/configurator.slice'

export const store = configureStore({
	reducer: {
		configurator: configuratorReducer
	},
	// The scene holds THREE objects and the store holds ids only, so the default
	// serializable check has nothing to complain about — left on deliberately.
	devTools: true
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
