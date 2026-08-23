import React, { useEffect } from 'react'
import './AuthButtons.scss'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'

const AuthButtons = ({ title, button1, button2, input, isBounded = false }) => {
	const { ref, focusKey, focusSelf } = useFocusableWithScroll({
		isFocusBoundary: isBounded
	})
	useEffect(() => {
		focusSelf()
	}, [focusSelf])
    
	return (
		<FocusContext.Provider value={focusKey}>
			<div className='auth-buttons'>
				<h2 className={title ? 'auth-buttons__title' : ''}>{title}</h2>
				{button1}
				<div className='auth-buttons__margin'></div>

				<div ref={ref}>{button2}</div>
			</div>
		</FocusContext.Provider>
	)
}

export default AuthButtons
