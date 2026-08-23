import React, { useEffect, useState } from 'react'
import '../Authorization.scss'
import {
	useFocusable,
	FocusContext
} from '@noriginmedia/norigin-spatial-navigation'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll'

const AuthInputs = ({ title, button1, button2, input, isBounded = true }) => {
	const [isDisabled, setIsDisabled] = useState(false)

	const { ref, focusKey, focusSelf } = useFocusable({
		isFocusBoundary: isBounded,
		onFocus: () => {
			setIsDisabled(false) 
		},
		onBlur: () => {
			setIsDisabled(true) 
		}
	})

	useEffect(() => {
		focusSelf()
	}, [focusSelf])

	return (
		<div className='auth-inputs'>
			<h2 className={title ? 'auth-inputs__title' : ''}>{title}</h2>
			<FocusContext.Provider value={focusKey}>
				<div ref={ref}>
					{button1}
					<div className='auth-inputs__margin'></div>
					<div>{button2}</div>
				</div>
			</FocusContext.Provider>
		</div>
	)
}

export default AuthInputs
