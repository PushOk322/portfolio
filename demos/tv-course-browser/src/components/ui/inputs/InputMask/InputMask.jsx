import React from 'react'
import { useState } from 'react'
import '../Input.scss'
import InputMask from '@mona-health/react-input-mask'

const InputWithMask = () => {
	const [code, setCode] = useState('')
	const handleInput = (e) => {
		setCode(e.target.value)
	}
	
	return (
		
			<InputMask
				mask='99-99-99-99'
				value={code}
				onChange={handleInput}
				maskPlaceholder='XX-XX-XX-XX'
				className='input-mask'
			/>
	
	)
}

export default InputWithMask
