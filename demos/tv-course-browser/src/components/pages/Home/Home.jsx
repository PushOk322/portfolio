import React, { useEffect } from 'react'
import './Home.scss'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import Container from '../../containers/Container/Container.jsx'
import CourseSlider from './CourseSlider/CourseSlider.jsx'
import Hero from './Hero/Hero.jsx'
import useFocusableWithScroll from '../../../hooks/useFocusableWIthScroll.jsx'
import useGeneralStore from '../../../store/useGeneralStore.js'

const Home = () => {
	const { data, setHeaderHidden } = useGeneralStore((state) => ({
		status: state.status,
		data: state.data,
		setHeaderHidden: state.setHeaderHidden
	}))
	
	const { ref: heroRef, focusKey: heroFocusKey } = useFocusableWithScroll()
	const { ref: sliderRef, focusKey: sliderFocusKey } = useFocusableWithScroll()

	useEffect(() => {
		setHeaderHidden(false)
	}, [setHeaderHidden])

	return (
		<div className='home'>
			<FocusContext.Provider value={heroFocusKey}>
				<Container ref={heroRef}>
					<Hero data={data} />
				</Container>
			</FocusContext.Provider>
			<FocusContext.Provider value={sliderFocusKey}>
				{data?.map((el, index) => {
					return (
						<Container variant='fullscreen' ref={sliderRef} key={index}>
							<CourseSlider course={el} />
						</Container>
					)
				})}
			</FocusContext.Provider>
		</div>
	)
}

export default Home
