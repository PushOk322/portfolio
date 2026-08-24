import React from 'react'
import './Course.scss'
import useFocusableWithScroll from '../../../hooks/useFocusableWIthScroll.jsx'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import CoursePreview from '../Courses/CoursePreview/CoursePreview.jsx'
import Container from '../../containers/Container/Container.jsx'
import { useParams } from 'react-router-dom'
import useGeneralStore from '../../../store/useGeneralStore.js'
import VideoCard from '../../widgets/cards/VideoCard/VideoCard.jsx'

const Course = () => {
	const { ref, focusKey } = useFocusableWithScroll()
	const urlParams = useParams()

	const { data } = useGeneralStore((state) => ({
		data: state.data
	}))

	const course = data?.find((item) => item.id === Number(urlParams.course_id))

	// `data` is null until the courses fetch resolves. Navigating in-app always has it
	// by now, which is why this never showed up in normal use — but a cold load straight
	// at a course URL (a refresh, or a shared link) renders this first, and
	// `course.videos` threw on undefined. All hooks above run unconditionally.
	if (!course) return null

	return (
		<FocusContext.Provider value={focusKey}>
			<div className='course-page' ref={ref}>
				<CoursePreview variant='as-hero' />

				<Container>
					<div className='course-page__videos'>
						{course.videos.map((item, index) => {
							if (item.type === 'intro') return
							return (
								<VideoCard
									key={index}
									video={item}
									forSlider={false}
									index={index}
									elemToScroll='.video-card'
									variant='for-grid'
									courseId={Number(urlParams.course_id)}
								/>
							)
						})}
					</div>
				</Container>
			</div>
		</FocusContext.Provider>
	)
}

export default Course
