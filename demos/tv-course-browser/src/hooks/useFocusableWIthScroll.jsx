import { useEffect, useCallback } from 'react'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'

const useFocusableWithScroll = (options, parentSelector = '.container') => {
	const { ref, focused, ...focusableProps } = useFocusable(options)

	const scrollToElement = useCallback(() => {
		const element = ref.current
		if (element) {
			const parentElement = element.closest(parentSelector)
			if (parentElement) {
				parentElement.scrollIntoView({
					behavior: 'smooth',
					block: 'center', // Adjust as needed
					inline: 'center' // Adjust as needed
				})
			}
		}
	}, [ref, parentSelector])

	useEffect(() => {
		if (focused) {
			scrollToElement()
		}
	}, [focused, scrollToElement])

	return { ref, focused, ...focusableProps }
}

export default useFocusableWithScroll

