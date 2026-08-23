import React from 'react'
import './Control.scss'
import PlayIcon from '../../../../assets/icons/play-icon.svg'
import PauseIcon from '../../../../assets/icons/pause-icon.svg'
import RewindIcon from '../../../../assets/icons/rewind-icon.svg'
import FastForwardIcon from '../../../../assets/icons/fast-forward-icon.svg'
import RewindIconBlack from '../../../../assets/icons/rewind-icon-black.svg'
import FastForwardIconBlack from '../../../../assets/icons/fast-forward-icon-black.svg'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import ControlItem from '../ControlItem/ControlItem.jsx'
import ProgressBar from './ProgressBar.jsx'

const Control = ({
	isHidden,
	onPlayPause,
	playing,
	onRewind,
	onForward,
	formattedCurrentTime,
	formattedDuration,
	duration,
	currentTime,
	controlRef,
	name,
	progressHandler
}) => {
	const { ref, focusKey } = useFocusableWithScroll({
		
	})
	const playedPercentage = (currentTime / duration) * 100
	return (
		<FocusContext.Provider value={focusKey}>
			<div className='control__focus-container' ref={ref}>
				<div
					// className={`control__control-container ${isHidden ? 'hidden' : ''}`}
					className={`control__control-container `}
					ref={controlRef}
				>
					<div className='control__gradient top'></div>
					<div className='control__gradient bottom'></div>
					<div className='control__video-name'>{name}</div>
					<div className='control__controls'>
						<div className='control__playrate-controls'>
							<ControlItem
								variant={'smaller'}
								iconActive={RewindIconBlack}
								icon={RewindIcon}
								onEnterPressFunc={onRewind}
							/>
							<ControlItem
								icon={playing ? PauseIcon : PlayIcon}
								onEnterPressFunc={onPlayPause}
							/>
							<ControlItem
								variant={'smaller'}
								icon={FastForwardIcon}
								iconActive={FastForwardIconBlack}
								onEnterPressFunc={onForward}
							/>
						</div>

						<ProgressBar
							formattedCurrentTime={formattedCurrentTime}
							formattedDuration={formattedDuration}
							playedPercentage={playedPercentage}
							onEnterPressFunc={() => {}}
							progressHandler={progressHandler}
						/>
					</div>
				</div>
			</div>
		</FocusContext.Provider>
	)
}

export default Control
