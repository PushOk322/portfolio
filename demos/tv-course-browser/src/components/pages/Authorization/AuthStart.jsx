import {
	FocusContext,
	useFocusable
} from '@noriginmedia/norigin-spatial-navigation'
import React, { useContext, useEffect } from 'react'
import Enter from '../../../assets/icons/enter.svg'
import EnterBlack from '../../../assets/icons/enterBlack.svg'
import { lang } from '../../../dictionaries/index.js'
import Button from '../../ui/buttons/Button/Button.jsx'
import AuthButtons from '../../ui/buttons/AuthButtons/AuthButtons.jsx'
import './Authorization.scss'
import { PATH } from '../../../constants/index.js'
import useUserStore from '../../../store/useUserStore.js'

const AuthStart = () => {
	const { ref, focused, focusKey, focusSelf } = useFocusable({})

	const { locale } = useUserStore((state) => ({ locale: state.user.locale }))

	useEffect(() => {
		focusSelf()
	}, [focusSelf])

	const title = lang[locale].authTitle1
	const formattedTitle = title.split(' ').map((word, index) => {
		if (index === 1) {
			return (
				<React.Fragment key={index}>
					{word} <br />
				</React.Fragment>
			)
		}
		return <React.Fragment key={index}>{word} </React.Fragment>
	})

	return (
		<FocusContext.Provider value={focusKey}>
			<div className='authorization' ref={ref}>
				<AuthButtons
					title={formattedTitle}
					isBounded={true}
					button1={
						<Button
							children={lang[locale].registration}
							className='authorization__button'
							link={PATH.AUTH_REGISTRATION}
						/>
					}
					button2={
						<Button
							children={lang[locale].enter}
							className='authorization__button authorization__button-enter'
							icon2={Enter}
							icon1Black={EnterBlack}
							link={PATH.AUTH_LOGIN}
						/>
					}
				/>
			</div>
		</FocusContext.Provider>
	)
}

export default AuthStart
