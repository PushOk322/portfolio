// import { useMemo, useEffect } from 'react'

// export const isLGTV = () => {
// 	const userAgent = navigator.userAgent.toLowerCase()
// 	return userAgent.includes('web0s') && userAgent.includes('linux/smarttv')
// }

// export const isTizenTV = () => {
// 	const userAgent = navigator.userAgent.toLowerCase()
// 	return userAgent.includes('tizen')
// }

// export const usePlatform = (location) => {
// 	const isLG = useMemo(() => isLGTV(), [])
// 	const isTizen = useMemo(() => isTizenTV(), [])

// 	useEffect(() => {
// 		if (isLG) {
// 			document.documentElement.classList.add('lg-tv')
// 		} else if (isTizen) {
// 			document.documentElement.classList.add('tizen-tv')
// 		} else {
// 			console.log('Приложение выполняется на другой платформе')
// 		}
// 	}, [location, isLG, isTizen])
// }
import { useMemo, useEffect } from 'react';

export const isLGTV = () => {
	const userAgent = navigator.userAgent.toLowerCase();
	return userAgent.includes('web0s') && userAgent.includes('linux/smarttv');
};

export const isTizenTV = () => {
	const userAgent = navigator.userAgent.toLowerCase();
	return userAgent.includes('tizen');
};

export const usePlatform = () => {
	const isLG = useMemo(() => isLGTV(), []);
	const isTizen = useMemo(() => isTizenTV(), []);

	useEffect(() => {
		if (isLG) {
			document.documentElement.classList.add('lg-tv');
		} else if (isTizen) {
			document.documentElement.classList.add('tizen-tv');
		} else {
			console.log('Приложение выполняется на другой платформе');
		}
	}, [isLG, isTizen]);

	return { isLG, isTizen };
};
