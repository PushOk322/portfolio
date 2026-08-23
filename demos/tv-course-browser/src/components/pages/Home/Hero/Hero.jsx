import React, { useRef, useState, memo, useCallback, useMemo } from 'react'
import './Hero.scss'
import {
	FocusContext,
	setFocus
} from '@noriginmedia/norigin-spatial-navigation'
import HeroSlide from './HeroSlide/HeroSlide'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import useBannersStore from '../../../../store/useBannersStore'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll'

const Hero = memo(() => {
	const { ref, focusKey } = useFocusableWithScroll()
	const swiperRef = useRef(null)
	const [activeIndex, setActiveIndex] = useState(0)
	const focusKeys = useRef([])
	const directionQueue = useRef([]) // Queue to track pending arrow presses

	const pagination = {
		clickable: true,
		renderBullet: function (index, className) {
			return '<span class="' + className + '">' + '</span>'
		}
	}

	const { banners } = useBannersStore((state) => ({
		banners: state.banners,
		status: state.status
	}))

	const bannersData = useMemo(() => banners.data || [], [banners.data])

	const processQueue = useCallback(() => {
		const swiper = swiperRef.current.swiper

		if (directionQueue.current.length > 0 && !swiper.animating) {
			const direction = directionQueue.current.shift() // Get the first direction in the queue

			if (direction === 'left') {
				swiper.slidePrev()
			} else if (direction === 'right') {
				swiper.slideNext()
			}
		}
	}, [])

	const onArrowPress = useCallback(
		(direction) => {
			directionQueue.current.push(direction) // Add the direction to the queue
			processQueue() // Try to process the queue immediately

			return true
		},
		[processQueue]
	)

	const handleSlideChange = useCallback(
		(swiper) => {
			const newIndex = swiper.realIndex
			if (newIndex !== activeIndex) {
				setActiveIndex(newIndex)
				setFocus(focusKeys.current[newIndex])
			}

			processQueue() // Process the next direction in the queue
		},
		[activeIndex, processQueue]
	)

	// Reset state when the focus is regained
	const handleFocus = useCallback(() => {
		directionQueue.current = []
	}, [])

	if (!bannersData.length) {
		return null
	}

	return (
		<FocusContext.Provider value={focusKey}>
			<section className='hero' ref={ref}>
				<Swiper
					slidesPerView={1}
					slideToClickedSlide={true}
					loop={true}
					speed={600}
					pagination={pagination}
					modules={[Pagination]}
					ref={swiperRef}
					onSlideChange={handleSlideChange}
					onTransitionEnd={processQueue} // Process any remaining actions
					onSwiper={(swiper) => {
						swiper.el.addEventListener('focus', handleFocus)
					}}
				>
					{bannersData.map((item, index) => (
						<SwiperSlide key={index}>
							<HeroSlide
								banners={item}
								index={index}
								onArrowPress={onArrowPress}
								onFocusKey={(focusKey) => (focusKeys.current[index] = focusKey)}
							/>
						</SwiperSlide>
					))}
				</Swiper>
			</section>
		</FocusContext.Provider>
	)
})

export default Hero
