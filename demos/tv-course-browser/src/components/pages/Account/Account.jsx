import React from 'react'
import './Account.scss'
import Container from '../../containers/Container/Container.jsx'
import AccountSettings from './AccountSettings/AccountSettings'
import KeyActivation from '../KeyActivation/KeyActivation.jsx'
import Language from '../Language/Language.jsx'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PATH } from '../../../constants/index.js'
import Logout from '../Logout/Logout.jsx'
import Offert from '../Offert/Offert.jsx'


const nodeObj = {
	ACCOUNT_SETTINGS: <AccountSettings />,
	KEYACTIVATION: <KeyActivation />,
	LANGUAGE: <Language />,
	OFFERT: <Offert />,
	LOGOUT: <Logout />
}

const Account = () => {
	return (
		<Container>
			<div className='account'>
				<Routes>
					<Route
						index
						element={<Navigate to={PATH.ACCOUNT_SETTINGS} replace />}
					/>
					{Object.keys(nodeObj).map((key, index) => (
						<Route element={nodeObj[key]} path={PATH[key]} key={index} />
					))}
				</Routes>
			</div>
		</Container>
	)
}

export default Account
