import React, { useContext, useMemo } from 'react'
import './CoursePreview.scss'
import CourseLength from '../../Home/Hero/CourseLength/CorseLength.jsx'
import Button from './../../../ui/buttons/Button/Button.jsx'
import VideoListIcon from '../../../../assets/icons/video-list-icon.svg'
import VideoListIconBlack from '../../../../assets/icons/video-list-icon-black.svg'
import AuthIcon from '../../../../assets/icons/auth-icon.svg'
import AuthIconBlack from '../../../../assets/icons/auth-icon-black.svg'
import PlayIcon from '../../../../assets/icons/play-icon-small.svg'
import PlayIconBlack from '../../../../assets/icons/play-icon-black-small.svg'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll.jsx'
import { lang } from '../../../../dictionaries/index.js'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import Container from '../../../containers/Container/Container.jsx'
import { PATH } from '../../../../constants/index.js'
import { cropText } from '../../../../utils/cropText.js'
import { useParams } from 'react-router-dom'
import useGeneralStore from '../../../../store/useGeneralStore.js'
import useUserStore from '../../../../store/useUserStore.js'

const CoursePreview = ({ variant = 'preview' }) => {
	const { ref, focusKey } = useFocusableWithScroll()

	const { locale, authenticated } = useUserStore((state) => ({
		locale: state.user.locale,
		authenticated: state.authenticated
	}))

	const { course_id } = useParams()
	const courseIdNumber = Number(course_id)

	const { data } = useGeneralStore((state) => ({
		data: state.data
	}))

	const course = data?.find((item) => item.id === courseIdNumber)

	return (
		<FocusContext.Provider value={focusKey}>
			<Container variant='fullscreen' ref={ref}>
				<div className={`course-preview ${variant}`}>
					<div className='course-preview__info'>
						<CourseLength text={course.videos.length} />
						<h1 className='course-preview__title'>{course.name}</h1>

						<p className='course-preview__description'>
							{cropText(course.description, 300)}
						</p>

						<div className='course-preview__forward'>
							{!authenticated && (
								<p className='course-preview__auth-warning'>
									{lang[locale].need_auth_to_watch}
								</p>
							)}
							{!authenticated ? (
								<Button
									icon1={AuthIcon}
									icon1Black={AuthIconBlack}
									variant='rounded'
									link={`/${PATH.AUTH}`}
								>
									{lang[locale].forward_to_auth}
								</Button>
							) : variant === 'preview' ? (
								<Button
									icon1={VideoListIcon}
									icon1Black={VideoListIconBlack}
									variant='rounded'
									link={`/${PATH.COURSES}/${course.id}`}
								>
									{lang[locale].forward_to_lesson}
								</Button>
							) : (
								<Button
									icon1={PlayIcon}
									icon1Black={PlayIconBlack}
									variant='rounded'
									link={`/${PATH.VIDEO}/${course.id}/${course.videos[0].id}`}
								>
									{lang[locale].forward_to_intro}
								</Button>
							)}
						</div>
					</div>
					<img
						src={course.preview_fullscreen}
						className='course-preview__img'
					></img>
					<div className='course-preview__gradient'></div>
				</div>
			</Container>
		</FocusContext.Provider>
	)
}

export default CoursePreview
