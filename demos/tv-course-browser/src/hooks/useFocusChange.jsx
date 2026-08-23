import { useState, useEffect } from 'react'
import { getCurrentFocusKey } from '@noriginmedia/norigin-spatial-navigation'

const useFocusChange = (initialFocusKey, delay) => {
	const [focusChangedRecently, setFocusChangedRecently] = useState(false)
	const [lastFocusKey, setLastFocusKey] = useState(initialFocusKey)

	useEffect(() => {
		const handleFocusChange = () => {
			setFocusChangedRecently(true)
			setLastFocusKey(getCurrentFocusKey())
			const timeoutId = setTimeout(() => {
				setFocusChangedRecently(false)
			}, delay)

			return () => clearTimeout(timeoutId)
		}

		// Set up a polling interval to check for focus changes
		const intervalId = setInterval(() => {
			const currentFocusKey = getCurrentFocusKey()
			if (currentFocusKey !== lastFocusKey) {
				handleFocusChange()
			}
		}, 100) // Check every 100ms

		return () => clearInterval(intervalId)
	}, [lastFocusKey, delay])

	return { focusChangedRecently, setFocusChangedRecently }
}

export default useFocusChange
