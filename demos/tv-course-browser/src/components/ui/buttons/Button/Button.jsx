import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Button.scss'
import '../../../pages/Authorization/Authorization.scss'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll'

const Button = ({
	className,
	icon1,
	icon2,
	children,
	icon1Black,
	variant = 'squared',
	link,
	onEnterPressFunc,
	setState,
	type,
	focusedProp,
	onArrowPress,
	onFocusKey
}) => {
	const navigate = useNavigate()
	const { ref, focused, focusKey} = useFocusableWithScroll({
		onEnterPress: () => {
			if (onEnterPressFunc) onEnterPressFunc()
			if (setState) setState()
			if (link) {
				console.log("Navigated by this link:", link)
				
				navigate(link)
			}
		},
		onArrowPress: (direction) => {
			if (onArrowPress) onArrowPress(direction)
		}
	})

	useEffect(() => {
		if (onFocusKey) onFocusKey(focusKey)
	}, [focusKey, onFocusKey])

	
	return (
		<button
			className={`button ${className} ${
				focused || focusedProp ? 'focused' : ''
			} ${variant}`}
			ref={ref}
			type={type}
		>
			{icon1 && (
				<img src={focused ? icon1Black : icon1} className='button__icon-left' />
			)}
			{children}
			{icon2 && (
				<img
					src={focused ? icon1Black : icon2}
					className='button__icon-right'
				/>
			)}
		</button>
	)
}

export default Button
