import create from 'zustand'
import { loadState, saveState } from '../utils/localStorage'

// initial state
const initialState = {
	currentVideoId: null
}

// Load state from localStorage
const persistedState = loadState('video') || initialState

// Create the VideoStore
const useVideoStore = create((set) => ({
	...persistedState,

	setCurrentVideoId: (videoId) => {
		set((state) => {
			const newState = { ...state, currentVideoId: videoId }
			saveState('video', newState)
			return newState
		})
	}
}))

export default useVideoStore
