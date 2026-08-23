import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './NavButton.scss'
import useFocusableWithScroll from '../../../../hooks/useFocusableWIthScroll'
import { useLocation } from 'react-router-dom'

const NavButton = ({ className, text, link, isActive }) => {
	const navigate = useNavigate()
	const { ref, focused } = useFocusableWithScroll(
		{
			onEnterPress: () => {
				navigate(`${link}`)
			}
		},
		'.header'
	)
	const location = useLocation()

	return (
		<div
			className={`nav-button ${className} ${focused ? 'focused' : ''} ${
				location.pathname.includes(link) ? 'isActive' : ''
			}`}
			ref={ref}
		>
			{text}
		</div>
	)
}

export default NavButton
