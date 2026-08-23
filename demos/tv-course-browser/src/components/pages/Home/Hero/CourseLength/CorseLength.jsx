import React, { useContext } from 'react'
import '../Hero.scss'
import { lang } from '../../../../../dictionaries/index.js'
import useUserStore from '../../../../../store/useUserStore.js'

const CourseLength = ({ text }) => {
	const { locale } = useUserStore((state) => ({
		locale: state.user.locale
	}))
	return (
		<div className='course-length'>
			{text}
			<span>{lang[locale].lessons}</span>
		</div>
	)
}
export default CourseLength
