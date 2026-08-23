import React, { useState, useRef, memo, useCallback } from 'react'
import './CourseSlider.scss'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Virtual } from 'swiper/modules'
import 'swiper/css'
import VideoCard from '../../../widgets/cards/VideoCard/VideoCard.jsx'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll.jsx'
import { lang } from '../../../../dictionaries/index.js'
import useUserStore from '../../../../store/useUserStore.js'

const CourseSlider = memo(({ course }) => {

	const { locale } = useUserStore((state) => ({
		locale: state.user.locale
	}))

	const { ref, focusKey } = useFocusableWithScroll()
	const swiperRef = useRef(null)
	const [activeIndex, setActiveIndex] = useState(0)

	const setActiveSlide = useCallback((index) => {
		if (swiperRef.current) {
			swiperRef.current.swiper.slideTo(index)
			setActiveIndex(index)
		}
	}, [])

	return (
		<FocusContext.Provider value={focusKey}>
			<div ref={ref} className='course-slider'>
				<h4 className='course-slider__heading'>
					{lang[locale].course}
					<span> {course.name.toUpperCase()}</span>
				</h4>
				<Swiper
					modules={[Virtual]}
					spaceBetween={23}
					slidesPerView={3.5}
					slideToClickedSlide={true}
					ref={swiperRef}
					className='course-slider__slider'
					onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
					// style={{ marginLeft: activeIndex === 0 ? '42px' : '0' }}
					virtual={{
						slidesBefore: 3,
						slidesAfter: 2
					}}
				>
					{course.videos.map((el, index) => (
						<SwiperSlide key={el.id} virtualIndex={index}>
							<VideoCard
								video={el}
								forSlider={true}
								setActiveSlide={() => setActiveSlide(index)}
								courseId={course.id}
								index={index}
								activeIndex={activeIndex}
							/>
						</SwiperSlide>
					))}
				</Swiper>
			</div>
		</FocusContext.Provider>
	)
})

export default CourseSlider
