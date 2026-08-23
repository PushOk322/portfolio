import React, { useContext, useState, useEffect } from 'react'
import './Authorization.scss'
import AuthInputs from './AuthInputs/AuthInputs.jsx'
import Button from '../../ui/buttons/Button/Button.jsx'
import {
	useFocusable,
	FocusContext
} from '@noriginmedia/norigin-spatial-navigation'
import Input from '../../ui/inputs/Input.jsx'
import { lang } from '../../../dictionaries/index.js'
import { PATH } from '../../../constants/index.js'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../../../store/useUserStore.js'
import useAuthStore from '../../../store/useAuthStore.js'

const AuthRegistration = () => {
	const { ref, focused, focusKey, focusSelf } = useFocusable({})

	const { locale } = useUserStore((state) => ({ locale: state.user.locale }))

	const { email, setEmail, createUser } = useAuthStore((state) => ({
		email: state.email,
		setEmail: state.setEmail,
		createUser: state.createUser,
		message: state.message
	}))

	const [inputError, setInputError] = useState(false)
	const [isValid, setIsValid] = useState(false)
	const navigate = useNavigate()

	useEffect(() => {
		focusSelf()
	}, [focusSelf])

	const validateEmail = (email) => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return re.test(String(email).toLowerCase())
	}

	useEffect(() => {
		setIsValid(validateEmail(email)) 
	}, [email])


	const handleSubmit = async (e) => {
		if (e) {
			e.preventDefault()
		}
		if (!validateEmail(email)) {
			setInputError(true)
			return
		}
		setInputError(false)
		const formData = {
			name: 'Test User',
			email: email,
			country_code: 'UA',
			device_name: 'LG',
			device_id: '8oeu7taoedn2-23oe'
		}
		try {
			await createUser(formData)
			navigate(`/${PATH.AUTH}/${PATH.AUTH_CODE}`)
		} catch (error) {
			const errorMessage = message || 'An unexpected error occurred'
			setApiError(errorMessage)
		}
		
		
	}

	const title = lang[locale].authTitleReg

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
				<form onSubmit={handleSubmit}>
					<AuthInputs
						title={formattedTitle}
						button1={
							<Input
								type={'email'}
								className={'authorization__email-input'}
								placeholder={lang[locale].yourEmail}
								setValue={setEmail}
								setErrorState={setInputError}
								error={inputError}
								textError={lang[locale].loginFormat}
								// isValid={isValid} // Передаем новое состояние
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

export default AuthRegistration
