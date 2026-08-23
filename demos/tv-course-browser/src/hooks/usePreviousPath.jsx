import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

function usePreviousPath() {
	const location = useLocation()
	const prevPath = useRef(location.pathname)

	useEffect(() => {
		const currentPath = location.pathname
		prevPath.current = currentPath
	}, [location])

	return prevPath.current
}

export default usePreviousPath
