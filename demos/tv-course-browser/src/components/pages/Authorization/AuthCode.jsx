import React, { useEffect, useState } from 'react'
import './Authorization.scss'
import AuthInputs from './AuthInputs/AuthInputs.jsx'
import Button from '../../ui/buttons/Button/Button.jsx'
import {
	useFocusable,
	FocusContext
} from '@noriginmedia/norigin-spatial-navigation'
import Input from '../../ui/inputs/Input.jsx'
import { lang } from '../../../dictionaries/index.js'
import { useNavigate } from 'react-router-dom'
import { PATH } from '../../../constants/index.js'
import useUserStore from '../../../store/useUserStore.js'
import useAuthStore from '../../../store/useAuthStore.js'

const AuthCode = () => {
	const { ref, focusKey, focusSelf } = useFocusable({})
	useEffect(() => {
		focusSelf()
	}, [focusSelf])

	const { code, email, setCode, auth_way, setEmail } = useAuthStore(
		(state) => ({
			code: state.code,
			email: state.email,
			setCode: state.setCode,
			auth_way: state.auth_way,
			setEmail: state.setEmail
		})
	)

	const { locale, authConfirm, error, message, setLocale } = useUserStore(
		(state) => ({
			locale: state.user.locale,
			authConfirm: state.authConfirm,
			error: state.error,
			message: state.message,
			setLocale: state.setLocale
		})
	)

	const transformedCode = code && code.replace(/-/g, '')

	const [inputError, setInputError] = useState(false)
	const navigate = useNavigate()
	const [apiError, setApiError] = useState('')

	const handleSubmit = async (e) => {
		if (e) {
			e.preventDefault()
		}
		const formData = {
			email: email,
			code: transformedCode
		}
		try {
			await authConfirm(formData)
			setLocale('uk')
			if (auth_way === 'account') {
				navigate(`/${PATH.ACCOUNT}/${PATH.ACCOUNT_SETTINGS}`)
			} else {
				navigate(-3)
			}
		} catch (error) {
			const errorMessage = message || 'Confirm code not correct'
			setApiError(errorMessage)
		}
	}

	const title = lang[locale].authTitle3

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
								placeholder={lang[locale].enterReceviedCode}
								setValue={setCode}
								setErrorState={setInputError}
								apiError={apiError}
								type={'text'}
								id='userInput'
								setApiError={setApiError}
								textError={apiError}
								error={inputError}
								inputType={'tel'}
							/>
						}
						button2={
							<Button
								children={'Активувати'}
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

export default AuthCode
