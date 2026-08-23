export const saveState = (key, state) => {
	try {
		const serializedState = JSON.stringify(state)
		localStorage.setItem(key, serializedState)
	} catch (e) {
		console.error('Could not save state', e)
	}
}

export const loadState = (key) => {
	try {
		const serializedState = localStorage.getItem(key)
		if (serializedState === null) return undefined
		return JSON.parse(serializedState)
	} catch (e) {
		console.error('Could not load state', e)
		return undefined
	}
}
