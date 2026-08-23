import {
	FocusContext,
	useFocusable
} from '@noriginmedia/norigin-spatial-navigation'
import React from 'react'
import { PATH } from '../../../constants/index.js'
import AuthCode from './AuthCode.jsx'
import AuthLogin from './AuthLogin.jsx'
import './Authorization.scss'
import AuthRegistration from './AuthRegistration.jsx'
import AuthStart from './AuthStart.jsx'
import { Routes, Route, Navigate } from 'react-router-dom'
const nodeObj = {
	AUTH_REGISTRATION: <AuthRegistration />,
	AUTH_LOGIN: <AuthLogin />,
	AUTH_CODE: <AuthCode />
}

const Authorization = () => {
	const { ref, focused, focusKey, focusSelf } = useFocusable({})
	return (
		<FocusContext.Provider value={focusKey}>
			<div className='authorization' ref={ref}>
				<Routes>
					<Route index element={<AuthStart />} />
					{Object.keys(nodeObj).map((key, index) => (
						<Route element={nodeObj[key]} path={PATH[key]} key={index} />
					))}
				</Routes>
			</div>
		</FocusContext.Provider>
	)
}

export default Authorization
