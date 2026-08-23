import React, { useState } from 'react'
import './KeyActivation.scss'
import AuthInputs from '../Authorization/AuthInputs/AuthInputs'
import Input from '../../ui/inputs/Input.jsx'
import Button from '../../ui/buttons/Button/Button.jsx'
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import useFocusableWithScroll from '../../../hooks/useFocusableWIthScroll.jsx'
import { lang } from '../../../dictionaries/index.js'
import KeySuccess from './KeySuccess/KeySuccess.jsx'
import { useEffect } from 'react'
import AccountSupport from '../Account/AccountSupport/AccountSupport.jsx'
import useUserStore from '../../../store/useUserStore.js'

const KeyActivation = () => {
	const { ref, focusKey, focusSelf } = useFocusableWithScroll({})

	const {
		requestError,
		setError,
		locale,
		keyValue,
		keyActivate,
		setKey,
		email,
		country_code,
		subscription,
		key_info
	} = useUserStore((state) => ({
		requestError: state.error,
		locale: state.user.locale,
		keyActivate: state.keyActivate,
		setKey: state.setKey,
		keyValue: state.key,
		email: state.user.email,
		country_code: state.user.country_code,
		setError: state.setError,
		subscription: state.user.subscription,
		key_info: state.user.key_info
	}))

	const title = lang[locale].activateKeyTitle
	const [isCodeActivated, setIsCodeActivated] = useState(false)
	const [apiError, setApiError] = useState(null)
	const [inputError, setInputError] = useState(false)
	const [isValid, setIsValid] = useState(false)
	const activationText = key_info?.data?.last_subscribe_product?.description

	const handleKeyActivate = () => {
		setIsCodeActivated(true)
	}

	const formattedText = title.split(' ').map((word, index) => {
		if (index === 2) {
			return (
				<React.Fragment key={index}>
					{word}
					<br />
				</React.Fragment>
			)
		}
		return <React.Fragment key={index}>{word} </React.Fragment>
	})

	useEffect(() => {
		focusSelf()
	}, [focusSelf])

	const validateCode = (keyValue) => {
		const re = keyValue?.length >= 9
		return re
	}

	useEffect(() => {
		if (keyValue) {
			setIsValid(validateCode(keyValue))
		}
	}, [keyValue])

	const handleSubmit = async (e) => {
		if (e) {
			e.preventDefault()
		}

		if (!validateCode(keyValue)) {
			setInputError(true)
		}
		const formData = {
			email: email,
			country_code: country_code,
			promocode: keyValue
			//promocode: '2658s4400'
		}
		try {
			await keyActivate(formData)
			handleKeyActivate()
		} catch (error) {
			const errorMessage = requestError || 'Unexpected error'
			setApiError(errorMessage)
		}
	}

	useEffect(() => {
		if (keyValue) {
			setApiError('')
		}
	}, [keyValue])

	return (
		<FocusContext.Provider value={focusKey}>
			<div className='key-activation' ref={ref}>
				<form onSubmit={handleSubmit}>
					<div className='key-activation__content'>
						{isCodeActivated === false && (
							<>
								<h2 className='key-activation__title'>{formattedText}</h2>
								<div className='key-activation__buttons'>
									<AuthInputs
										button1={
											<Input
												type='text'
												apiError={apiError}
												setValue={setKey}
												textError={apiError}
												id='userInput'
												setApiError={setApiError}
												setErrorState={setInputError}
												isValid={isValid}
											/>
										}
										button2={
											<Button
												className='standart'
												children={lang[locale].activate}
												onEnterPressFunc={handleSubmit}
											/>
										}
									/>
								</div>
							</>
						)}
						{isCodeActivated === true && (
							<KeySuccess activationText={activationText} />
						)}
					</div>
				</form>
				<AccountSupport />
			</div>
		</FocusContext.Provider>
	)
}

export default KeyActivation
