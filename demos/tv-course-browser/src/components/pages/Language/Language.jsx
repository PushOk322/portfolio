import React, { useContext } from 'react'
import './Language.scss'
import useFocusableWithScroll from '../../../hooks/useFocusableWIthScroll.jsx'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import Button from '../../ui/buttons/Button/Button.jsx'
import { lang } from '../../../dictionaries'
import { useEffect } from 'react'
import AccountSupport from '../Account/AccountSupport/AccountSupport.jsx'
import useUserStore from '../../../store/useUserStore.js'
import { useNavigate } from 'react-router-dom'

const Language = () => {
	const { focusSelf, ref, focusKey } = useFocusableWithScroll({})

	const navigate = useNavigate()

	const { locale, setLocale } = useUserStore((state) => ({
		locale: state.user.locale,
		setLocale: state.setLocale
	}))

	const languages = [
		lang[locale].ukrainian,
		lang[locale].russian,
		lang[locale].english
	]
	const locales = ['uk', 'ru', 'en']

	useEffect(() => {
		focusSelf()
	}, [focusSelf])

	return (
		<FocusContext.Provider value={focusKey}>
			<div className='language' ref={ref}>
				<div className='language__content'>
					<h2 className='language__content-title'>
						{lang[locale].selectLanguage}
					</h2>
					<p className='language__content__text'>
						{lang[locale].languagePrediction}
					</p>
					<div className='language__content-buttons'>
						{languages &&
							languages.map((language, index) => (
								<div key={index}>
									<Button
										className='standart'
										children={language}
										onEnterPressFunc={() => {
											setLocale(locales[index])
											navigate(-1)
										}}
									/>
								</div>
							))}
					</div>
					<AccountSupport />
				</div>
			</div>
		</FocusContext.Provider>
	)
}

export default Language
