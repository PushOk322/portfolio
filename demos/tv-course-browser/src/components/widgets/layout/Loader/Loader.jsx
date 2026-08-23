import React from 'react'
import './Loader.scss'
import LogoLoaderImg from '../../../../assets/images/logo-loader.png'

const Loader = ({ isLoaded }) => {
	return (
		<div className={`loader ${isLoaded ? 'hidden' : ''}`}>
			<img src={LogoLoaderImg} alt='' className='loader__img' />
		</div>
	)
}

export default Loader
