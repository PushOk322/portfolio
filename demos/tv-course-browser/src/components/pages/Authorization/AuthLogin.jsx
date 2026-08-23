import React, { useState, useEffect, useCallback } from 'react'
import './Authorization.scss'
import AuthInputs from './AuthInputs/AuthInputs.jsx'
import Button from '../../ui/buttons/Button/Button.jsx'
import {
	useFocusable,
	FocusContext
} from '@noriginmedia/norigin-spatial-navigation'
import Input from '../../ui/inputs/Input.jsx'
import { PATH } from '../../../constants/index.js'
import { useNavigate } from 'react-router-dom'
import { lang } from '../../../dictionaries/index.js'
import useUserStore from '../../../store/useUserStore.js'
import useAuthStore from '../../../store/useAuthStore.js'

const AuthLogin = () => {
	const { ref, focused, focusKey, focusSelf } = useFocusable({})

	const { email, setEmail, loginUser, error, message } = useAuthStore(
		(state) => ({
			email: state.email,
			setEmail: state.setEmail,
			loginUser: state.loginUser,
			error: state.error,
			message: state.message
		})
	)

	const memoizedSetEmail = useCallback(
		(email) => {
			setEmail(email)
		},
		[setEmail]
	)

	const { locale } = useUserStore((state) => ({ locale: state.user.locale }))

	const [inputError, setInputError] = useState(false)
	const [isValid, setIsValid] = useState(false)
	const navigate = useNavigate()
	const [apiError, setApiError] = useState('')
	const [typedEmail, setTypedEmail] = useState(null)
	const title = lang[locale].authTitle2
	console.log(typedEmail)
	
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

	useEffect(() => {
		focusSelf()
	}, [focusSelf])

	const validateEmail = (typedEmail) => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
		return re.test(String(typedEmail).toLowerCase())
	}

	useEffect(() => {
		setIsValid(validateEmail(typedEmail))
	}, [typedEmail])

	const handleSubmit = async (e) => {
		if (e) {
			e.preventDefault()
		}
		if (!validateEmail(email)) {
			setInputError(true)
			return
		}
		const formData = {
			email: email,
			country_code: 'UA',
			device_name: 'LG',
			device_id: '8oeu7taoedn2-23oe'
		}
		try {
			await loginUser(formData)
			navigate('/authorization/code')
		} catch (error) {
			const errorMessage = message || 'An unexpected error occurred'
			setApiError(errorMessage)
		}
	}
		
	return (
		<FocusContext.Provider value={focusKey}>
			<div className='authorization' ref={ref}>
				<form onSubmit={handleSubmit}>
					<AuthInputs
						title={formattedTitle}
						button1={
							<Input
								type={'email'}
								className={'authorization__email-input'}
								placeholder={lang[locale].yourEmail}
								setValue={(value) => {
									setTypedEmail(value);
									memoizedSetEmail(value);
								}}
								setErrorState={setInputError}
								apiError={apiError}
								setApiError={setApiError}
								id='userInput'
								textError={
									inputError
										? lang[locale].loginFormat
										: lang[locale].loginMistake
								}
								// textError={apiError}
								error={inputError}
								isValid={isValid}
							/>
						}
						button2={
							<Button
								children={lang[locale].sendCode}
								className='authorization__button'
								type='submit'
								onEnterPressFunc={handleSubmit}
							/>
						}
					/>
				</form>
			</div>
		</FocusContext.Provider>
	)
}

export default AuthLogin
