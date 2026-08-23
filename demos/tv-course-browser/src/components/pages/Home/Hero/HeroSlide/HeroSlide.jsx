import React, { memo, useCallback } from 'react'
import '../Hero.scss'
import CourseLength from '../CourseLength/CorseLength'
import Button from '../../../../ui/buttons/Button/Button.jsx'
import VideoIcon from '../../../../../assets/icons/hero-video-icon.svg'
import VideoIconActive from '../../../../../assets/icons/video-hero-active.svg'
import useFocusableWithScroll from '../../../../../hooks/useFocusableWIthScroll'
import { PATH } from '../../../../../constants/index.js'
import { lang } from '../../../../../dictionaries/index.js'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import useUserStore from '../../../../../store/useUserStore.js'

const HeroSlide = memo(({ banners, onArrowPress, onFocusKey }) => {
	const { locale } = useUserStore((state) => ({ locale: state.user.locale }))
	const { ref, focused, focusKey } = useFocusableWithScroll({
		isFocusBoundary: true,
		focusBoundaryDirections: ['left', 'right'],
		onArrowPress: useCallback(
			(direction) => onArrowPress(direction),
			[onArrowPress]
		)
	})

	return (
		<FocusContext.Provider value={focusKey}>
			<div className='hero-slider' ref={ref}>
				<div className='hero-info'>
					<CourseLength text={banners.episodes_count} />
					<h1 className='hero-info__title'>{banners.title}</h1>
					<p className='hero-info__text'>
						{/* {cropText(banners.description, 120)} */}
						{banners.description}
					</p>
					<div className='hero-info__lessons'>
						<Button
							children={lang[locale].passToLessons}
							icon1={focused ? VideoIconActive : VideoIcon}
							icon1Black={VideoIconActive}
							link={`/${PATH.COURSES}/${PATH.COURSE_PREVIEW}/${banners.course_id}`}
							focusedProp={focused}
							variant='rounded'
							className={focused && 'hero-info__lessons-button'}
							onArrowPress={onArrowPress}
							onFocusKey={onFocusKey}
						/>
					</div>
				</div>
				<div className='hero-image'>
					<img
						src={banners.preview}
						alt='main-image'
						className='hero-image__main'
					/>
				</div>
			</div>
		</FocusContext.Provider>
	)
})

export default HeroSlide
