import React from 'react'
import '../KeyActivation.scss'
import Button from '../../../ui/buttons/Button/Button.jsx'
import { PATH } from '../../../../constants/index.js'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll.jsx'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect } from 'react'
import { lang } from '../../../../dictionaries/index.js'
import useUserStore from '../../../../store/useUserStore.js'

const KeySuccess = ({activationText}) => {
	const { focusSelf, ref, focusKey } = useFocusableWithScroll({})
	const { locale } = useUserStore((state) => ({
		locale: state.user.locale,
	}))
	const serviceWord = lang[locale].service
	const activationWord = lang[locale].keyActivationWord
	
	useEffect(() => {
		focusSelf()
	}, [])
	
	return (
		<FocusContext.Provider value={focusKey}>
			<div className='key-activation__content' ref={ref}>
				<h2 className='key-activation__title'>
					{serviceWord} {activationText}<br />{activationWord}
				</h2>
				<p className='key-activation__text'>{lang[locale].keyActivationTerm}</p>
				<Button
					children={lang[locale].onMain}
					className='standart'
					link={'/' + PATH.HOME}
				/>
			</div>
		</FocusContext.Provider>
	)
}

export default KeySuccess
