import create from 'zustand'
import { loadState, saveState } from '../utils/localStorage'

// Initial state
const initialState = {
	id: null
}

// Load state from localStorage
const persistedState = loadState('course') || initialState

// Create the store
const useCourseStore = create((set) => ({
	...persistedState,

	setCourse: (id) => {
		set((state) => {
			const newState = { ...state, id }
			saveState('course', newState)
			return newState
		})
	}
}))

export default useCourseStore
