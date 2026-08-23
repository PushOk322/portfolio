import React, { useState, useEffect } from 'react'
import './Layout.scss'
import { Outlet } from 'react-router-dom'
import { FocusContext, init } from '@noriginmedia/norigin-spatial-navigation'
import Header from '../../widgets/layout/Header/Header.jsx'
import useFocusableWithScroll from '../../../hooks/useFocusableWIthScroll.jsx'
// Portfolio build: a browser visitor has no remote and no way to guess.
import RemoteHint from '../../widgets/layout/RemoteHint/RemoteHint.jsx'

export default function Layout() {
	const [isHomeLoaded, setIsHomeLoaded] = useState(false)

	init({
		// debug: true,
		// visualDebug: true,
		throttle: 100,
		throttleKeypresses: true
	})

	const { ref, focusKey, focusSelf } = useFocusableWithScroll({
		isFocusBoundary: true
	})

	useEffect(() => {
		focusSelf()
		setIsHomeLoaded(true)
	}, [focusSelf])

	return (
		<FocusContext.Provider value={focusKey}>
			<div className='root-layout' ref={ref}>
				{isHomeLoaded && <Header />}
				<main className='outlet' id='outlet'>
					<Outlet />
				</main>
				<RemoteHint />
			</div>
		</FocusContext.Provider>
	)
}
