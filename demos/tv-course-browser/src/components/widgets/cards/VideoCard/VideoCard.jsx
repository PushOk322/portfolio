import React, { memo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom' // Import Link from React Router
import './VideoCard.scss'
import BlockedIcon from '../../../../assets/icons/lock.svg'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll'
import { PATH } from '../../../../constants/index.js'
import useUserStore from '../../../../store/useUserStore.js'
import { lang } from '../../../../dictionaries/index.js'
import useVideoStore from '../../../../store/useVideoStore.js'
import useCourseStore from '../../../../store/useCourseStore.js'

const VideoCard = memo(
	({
		video,
		forSlider = false,
		setActiveSlide,
		index,
		elemToScroll = '.container',
		variant = 'default',
		courseId,
		activeIndex
	}) => {
		const navigate = useNavigate()
		const { authenticated, locale } = useUserStore((state) => ({
			authenticated: state.authenticated,
			locale: state.user.locale
		}))
		const { setCurrentVideoId } = useVideoStore((state) => ({
			setCurrentVideoId: state.setCurrentVideoId
		}))
		const { setCourse } = useCourseStore((state) => ({
			setCourse: state.setCourse
		}))
		const { ref, focused } = useFocusableWithScroll(
			{
				onEnterPress: () => {
					if (video.is_paid || video.type === 'intro') {
						setCourse(courseId)
						setCurrentVideoId(video.id)
						navigate(`/${PATH.VIDEO}`)
					} else if (!authenticated) {
						navigate(`/${PATH.AUTH}`)
					} else {
						//NEED TO ADD A LINK TO PAYMENT
						// navigate(`/`)
						return
					}
				}
			},
			elemToScroll
		)

		useEffect(() => {
			if (focused && forSlider && activeIndex !== index) {
				setActiveSlide(index)
			}
		}, [focused, index, forSlider, activeIndex])

		return (
			<div
				ref={ref}
				className={`video-card ${focused ? 'focused' : ''} ${variant}`}
			>
				{video.is_paid || video.type === 'intro' ? (
					''
				) : (
					<div className='video-card__blocked'>
						<img
							src={BlockedIcon}
							alt='video-blocked-icon'
							className='video-card__blocked-icon'
						/>
					</div>
				)}
				<img
					src={video.preview}
					alt='video-preview'
					className='video-card__img'
					loading='lazy'
					// decoding='async'
				/>
				<div className='video-card__info'>
					<div className='video-card__name'>
						<span>
							{video.type === 'video_with_banner'
								? lang[locale].lesson
								: lang[locale].intro}{' '}
							{video.type === 'intro' ? '' : video.number}{' '}
						</span>
						{video.name}
					</div>
					<div className='video-card__length'>{video.duration}</div>
				</div>
			</div>
		)
	}
)

export default VideoCard
