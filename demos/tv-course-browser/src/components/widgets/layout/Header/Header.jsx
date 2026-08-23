import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Logo from '../../../../assets/images/online.Fitness.svg'
import { PATH } from '../../../../constants/index.js'
import { lang } from '../../../../dictionaries/index.js'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll.jsx'
import NavButton from '../../../ui/buttons/NavButton/NavButton.jsx'
import './Header.scss'
import useUserStore from '../../../../store/useUserStore.js'
import useGeneralStore from '../../../../store/useGeneralStore.js'

const Header = () => {
	const { locale } = useUserStore((state) => ({
		locale: state.user.locale
	}))
	const location = useLocation()
	const links = [PATH.HOME, PATH.COURSES, PATH.ACCOUNT]
	const excludesLinks = [
		`/${PATH.AUTH}`,
		`/${PATH.AUTH}/${PATH.AUTH_REGISTRATION}`,
		`/${PATH.AUTH}/${PATH.AUTH_LOGIN}`,
		`/${PATH.AUTH}/${PATH.AUTH_CODE}`
	]

	const navLinks = [
		lang[locale].navMain,
		lang[locale].navCourses,
		lang[locale].navAccount
	]

	const { ref, focusKey, focusSelf } = useFocusableWithScroll({})
	const { isHeaderHidden } = useGeneralStore((state) => ({
		isHeaderHidden: state.isHeaderHidden
	}))

	useEffect(() => {
		focusSelf()
	}, [focusSelf, location])

	return (
		<FocusContext.Provider value={focusKey}>
			<div
				className={`header ${isHeaderHidden ? 'hidden' : ''}`}
				ref={ref}
				id='tv-header'
			>
				<img src={Logo} alt='logo' className='header__logo' />
				{!excludesLinks.includes(location.pathname) && (
					<div className='header-navigation'>
						{navLinks.map((item, index) => (
							<NavButton key={index} text={item} link={`/` + links[index]} />
						))}
					</div>
				)}
				<div></div>
			</div>
		</FocusContext.Provider>
	)
}

export default Header
