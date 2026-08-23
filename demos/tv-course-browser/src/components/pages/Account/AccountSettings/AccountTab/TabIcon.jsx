import React from 'react'
import '../../Account.scss'

const TabIcon = ({icon,focused}) => {
	return <div className={`tab-icon ${focused && "focused"}`}><img src={icon} alt="tabIcon" className='tab-icon__image'/></div>
}

export default TabIcon
