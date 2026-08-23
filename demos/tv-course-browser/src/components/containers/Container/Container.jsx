import './Container.scss'
import React, { forwardRef } from 'react'

const Container = forwardRef(
	({ variant = 'default', className = '', children, ...props }, ref) => {

		return (
			<div
				className={`container ${className} ${
					variant === 'fullscreen' ? 'fullscreen' : ''
				}`}
				ref={ref}
				{...props}
			>
				{children}
			</div>
		)
	}
)

export default Container
