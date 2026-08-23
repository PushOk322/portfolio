import React, { useEffect } from 'react'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import './ControlItem.scss'

const ControlItem = ({ variant, icon, iconActive, onEnterPressFunc }) => {
	const { ref, onEnterPress, focused, focusSelf } = useFocusable({
		onEnterPress: () => {
			{
				onEnterPressFunc && onEnterPressFunc()
			}
		}
	})

	useEffect(() => {
		if (!variant) {
			focusSelf()
		}
	}, [])

	return (
		<div
			className={`control-item ${focused ? 'focused' : ''} ${
				variant === 'smaller' ? 'smaller' : ''
			}`}
			ref={ref}
		>
			<img
				src={focused && iconActive ? iconActive : icon}
				alt='control-icon'
				className={`control-item__icon ${focused ? 'focused' : ''}`}
			/>
		</div>
	)
}
export default ControlItem
