import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom' // Import Link from React Router
import './CourseCard.scss'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll'
import { PATH } from '../../../../constants'
import useCourseStore from '../../../../store/useCourseStore'
import useGeneralStore from '../../../../store/useGeneralStore'

const CourseCard = ({ course, focusSelfFlag }) => {
	const navigate = useNavigate()
	const { setLastOpenedCourse } = useGeneralStore((state) => ({
		setLastOpenedCourse: state.setLastOpenedCourse
	}))
	const { ref, onEnterPress, focused, focusSelf } = useFocusableWithScroll({
		onEnterPress: () => {
			setCourse({ id: course.id })
			setLastOpenedCourse({ lastOpenedCourse: course.id })
			navigate(`/${PATH.COURSES}/${PATH.COURSE_PREVIEW}/${course.id}`)
		}
	})

	const { setCourse } = useCourseStore((state) => ({
		setCourse: state.setCourse
	}))

	useEffect(() => {
		if (focusSelfFlag) {
			focusSelf()
		}
	}, [focusSelf])

	return (
		<div
			ref={ref}
			className={`course-card ${focused ? 'focused' : ''}`}
			role='link'
			tabIndex='0' // Make it focusable
		>
			<img
				src={course.preview}
				alt='course-preview'
				className='course-card__img'
			/>

			<div className='course-card__name'>{course.name}</div>
		</div>
	)
}

export default CourseCard
