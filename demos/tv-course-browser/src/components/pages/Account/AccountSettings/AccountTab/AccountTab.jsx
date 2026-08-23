import React, { useEffect } from 'react'
import '../../Account.scss'
import TabIcon from './TabIcon'
import useFocusableWithScroll from '../../../../../hooks/useFocusableWIthScroll'
import { useNavigate } from 'react-router-dom'
import { PATH } from '../../../../../constants'
import useUserStore from '../../../../../store/useUserStore'
import useGeneralStore from '../../../../../store/useGeneralStore'
import useAuthStore from '../../../../../store/useAuthStore'


const AccountTab = ({
	variant,
	icon,
	iconBlack,
	text,
	link,
	isLogin,
	focusSelfFlag
}) => {
	const { authenticated } = useUserStore((state) => ({
		authenticated: state.authenticated
	}))
	const { auth_way, setAuthWay } = useAuthStore((state) => ({
		auth_way: state.auth_way,
		setAuthWay: state.setAuthWay
	}))

	const { setLastAccountOpenedTab } = useGeneralStore((state) => ({
		setLastAccountOpenedTab: state.setLastAccountOpenedTab
	}))
	const navigate = useNavigate()

	const { focused, ref, focusSelf } =
		variant === 'disabled'
			? { focused: false, ref: null }
			: useFocusableWithScroll({
					onEnterPress: () => {
						setAuthWay('account')
						if (link && variant !== 'disabled') {
							setLastAccountOpenedTab({ link })
							navigate(
								`${!authenticated && isLogin ? '' : `/${PATH.ACCOUNT}`}/${link}`
							)
						}
					}
			  })

	useEffect(() => {
		if (focusSelfFlag) {
			focusSelf()
		}
	}, [focusSelf])

	return (
		<button
			className={`account-settings-tab ${focused ? 'focused' : ''} ${
				variant === 'disabled' ? 'disabled' : ''
			}`}
			ref={ref}
			type='button'
			disabled={variant === 'disabled'}
		>
			<TabIcon icon={focused ? iconBlack : icon} focused={focused} />
			<p className={`account-settings-tab__text ${focused ? 'focused' : ''}`}>
				{text}
			</p>
		</button>
	)
}

export default AccountTab
