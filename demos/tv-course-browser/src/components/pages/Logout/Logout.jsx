import React, { useEffect } from 'react'
import './Logout.scss'
import AuthInputs from '../../pages/Authorization/AuthInputs/AuthInputs.jsx'
import AuthButtons from '../../ui/buttons/AuthButtons/AuthButtons.jsx'
import Button from '../../ui/buttons/Button/Button.jsx'
import AccountSupport from '../Account/AccountSupport/AccountSupport.jsx'
import useFocusableWithScroll from '../../../hooks/useFocusableWIthScroll.jsx'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { PATH } from '../../../constants/index.js'
import { useNavigate } from 'react-router-dom'
import { lang } from '../../../dictionaries/index.js'
import useUserStore from '../../../store/useUserStore.js'
import useAuthStore from '../../../store/useAuthStore.js'

const Logout = () => {
	const navigate = useNavigate()

	const { focusSelf, ref, focusKey } = useFocusableWithScroll({})

	useEffect(() => {
		focusSelf()
	}, [focusSelf])

	const { locale, logout } = useUserStore((state) => ({
		locale: state.user.locale,
		logout: state.logout
	}))
	const { setEmail } = useAuthStore()

	const handleLogout = async () => {
		try {
			await logout()
			navigate(-1)
			setEmail(null)
		} catch (error) {
			console.error('Logout failed: ', error)
		}
	}

	return (
		<FocusContext.Provider value={focusKey}>
			<div className='logout' ref={ref}>
				<div className='logout__content'>
					<h2 className='logout__content-title'>{lang[locale].logoutTitle}</h2>
					<AuthButtons
						button1={
							<Button
								children={lang[locale].logoutQuit}
								className='standart'
								onEnterPressFunc={handleLogout}
							/>
						}
						button2={
							<Button
								children={lang[locale].logoutRemain}
								className='standart'
								link={`/${PATH.ACCOUNT}/${PATH.ACCOUNT_SETTINGS}`}
							/>
						}
					/>
					<AccountSupport />
				</div>
			</div>
		</FocusContext.Provider>
	)
}

export default Logout
