import React from 'react'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import './ProgressBar.scss'

const ProgressBar = ({
	formattedCurrentTime,
	formattedDuration,
	playedPercentage,
	onEnterPressFunc,
	progressHandler
}) => {
	const { ref, onEnterPress, focused } = useFocusable({
		onEnterPress: () => {
			{
				onEnterPressFunc && onEnterPressFunc()
			}
		},
		onArrowPress: (direction) => {
			if (progressHandler && focused) progressHandler(direction)
		}
	})

	return (
		<div className='progress-bar' ref={ref}>
			<div className='progress-bar__time'>{formattedCurrentTime}</div>
			<div className={`progress-bar__progress-bar ${focused ? 'focused' : ''}`}>
				<div
					className='progress-bar__progress-bar-filled'
					style={{ width: `${playedPercentage}%` }}
				></div>
			</div>
			<div className='progress-bar__time'>{formattedDuration}</div>
		</div>
	)
}
export default ProgressBar
