import React, { useEffect } from 'react'
import '../Account.scss'
import AccountTab from './AccountTab/AccountTab'
import AccountSupport from '../AccountSupport/AccountSupport.jsx'
import LangIcon from '../../../../assets/icons/langugeIcon.svg'
import LangIconBlack from '../../../../assets/icons/languageBlack.svg'
import KeyIcon from '../../../../assets/icons/whiteKey.svg'
import KeyIconBlack from '../../../../assets/icons/keyIcon.svg'
import OffertIcon from '../../../../assets/icons/offertIcon.svg'
import OffertIconBlack from '../../../../assets/icons/blackOffert.svg'
import ExitIcon from '../../../../assets/icons/exitIcon.svg'
import ExitIconBlack from '../../../../assets/icons/blackExit.svg'
import { lang } from '../../../../dictionaries/index.js'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll.jsx'
import { PATH } from '../../../../constants/index.js'
import useUserStore from '../../../../store/useUserStore.js'
import useGeneralStore from '../../../../store/useGeneralStore.js'
import { useNavigate } from 'react-router-dom'

const AccountSettings = () => {
	const { authenticated } = useUserStore((state) => ({
		authenticated: state.authenticated
	}))

	const navigate = useNavigate()

	const { lastAccountOpenedTab, setLastAccountOpenedTab } = useGeneralStore(
		(state) => ({
			lastAccountOpenedTab: state.lastAccountOpenedTab,
			setLastAccountOpenedTab: state.setLastAccountOpenedTab
		})
	)

	const icons = [KeyIcon, LangIcon, OffertIcon, ExitIcon]
	const iconsBlack = [
		KeyIconBlack,
		LangIconBlack,
		OffertIconBlack,
		ExitIconBlack
	]

	const { locale } = useUserStore((state) => ({ locale: state.user.locale }))
	const { ref, focusKey } = useFocusableWithScroll()

	const tabTitle = [
		lang[locale].accountKey,
		lang[locale].accountLang,
		lang[locale].accountOffert,
		authenticated ? lang[locale].accountExit : lang[locale].accountLogin
	]

	const links = [
		PATH.KEYACTIVATION,
		PATH.LANGUAGE,
		PATH.OFFERT,
		authenticated ? PATH.LOGOUT : PATH.AUTH
	]

	useEffect(() => {
		setLastAccountOpenedTab({ lastAccountOpenedTab: null })
	}, [])

	// window.onpopstate = () => {
	// 	navigate('/')
	// }

	return (
		<FocusContext.Provider value={focusKey}>
			<div className='account-settings' ref={ref}>
				<h2 className='account-settings__title'>
					{lang[locale].accountTitle1}
				</h2>
				<div className='account-settings__margin'></div>
				<div className='account-settings__tabs-container'>
					{icons.map((icon, index) => (
						<AccountTab
							key={index}
							icon={icon}
							iconBlack={iconsBlack[index]}
							text={tabTitle[index]}
							link={links[index]}
							variant={authenticated === false && index === 0 ? 'disabled' : ''}
							isLogin={index === 3 ? true : false}
							focusSelfFlag={
								links[index] === lastAccountOpenedTab?.link ? true : undefined
							}
						/>
					))}
				</div>
				<AccountSupport />
			</div>
		</FocusContext.Provider>
	)
}

export default AccountSettings
