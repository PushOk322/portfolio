import React, { useEffect, useState } from 'react'

import './RemoteHint.scss'

const DISMISSED_KEY = 'tv-demo:remote-hint-dismissed'

/**
 * Tells the visitor this thing is driven by a remote control.
 *
 * Portfolio-build addition. On an actual TV nobody needs telling — the remote is in
 * their hand. In a browser tab the app looks unresponsive to a mouse, because focus
 * moves on arrow keys and there is nothing to click. Without this, a recruiter clicks
 * twice, concludes it's broken, and leaves.
 *
 * Dismisses on its own once the visitor presses an arrow key, which is the moment the
 * hint has done its job.
 */
const RemoteHint = () => {
	const [visible, setVisible] = useState(
		() => window.sessionStorage.getItem(DISMISSED_KEY) !== '1'
	)

	useEffect(() => {
		if (!visible) return

		const onKey = (event) => {
			const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter']
			if (!keys.includes(event.key)) return

			window.sessionStorage.setItem(DISMISSED_KEY, '1')
			setVisible(false)
		}

		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [visible])

	if (!visible) return null

	// A phone has no arrow keys, so the desktop wording is useless there. Say so plainly
	// rather than leaving a touch visitor prodding a UI that cannot respond.
	const isTouch = window.matchMedia('(pointer: coarse)').matches

	return (
		<div className='remote-hint' role='note'>
			<p className='remote-hint__title'>
				{isTouch ? 'Best viewed on a desktop' : 'Use your arrow keys'}
			</p>
			<p className='remote-hint__text'>
				{isTouch ? (
					<>
						This is a television app, driven by a remote control. It renders here, but
						navigating it needs a keyboard — open this page on a computer to try it.
					</>
				) : (
					<>
						This is a TV app — navigate with <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd>{' '}
						<kbd>→</kbd> and select with <kbd>Enter</kbd>. There is nothing to click.
					</>
				)}
			</p>
			<button
				type='button'
				className='remote-hint__close'
				onClick={() => {
					window.sessionStorage.setItem(DISMISSED_KEY, '1')
					setVisible(false)
				}}
			>
				Got it
			</button>
		</div>
	)
}

export default RemoteHint
