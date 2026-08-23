import React, { useEffect } from 'react'
import './Courses.scss'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import CourseCard from '../../widgets/cards/CourseCard/CourseCard.jsx'
import useFocusableWithScroll from '../../../hooks/useFocusableWIthScroll.jsx'
import Container from '../../containers/Container/Container.jsx'
import useGeneralStore from '../../../store/useGeneralStore.js'

const Courses = () => {
	const { ref, focusKey } = useFocusableWithScroll()
	const { data, lastOpenedCourse, setLastOpenedCourse } = useGeneralStore(
		(state) => ({
			data: state.data,
			lastOpenedCourse: state.lastOpenedCourse,
			setLastOpenedCourse: state.setLastOpenedCourse
		})
	)

	useEffect(() => {
		setLastOpenedCourse({ lastOpenedCourse: null })
	}, [setLastOpenedCourse])

	const focusFlags = data?.map(
		(item) => item.id === lastOpenedCourse?.lastOpenedCourse
	)

	return (
		<FocusContext.Provider value={focusKey}>
			<Container ref={ref}>
				<section className='courses-grid'>
					{data &&
						data.map((item, index) => (
							<CourseCard
								course={item}
								index={index}
								key={index}
								focusSelfFlag={focusFlags[index]}
							/>
						))}
				</section>
			</Container>
		</FocusContext.Provider>
	)
}

export default Courses
