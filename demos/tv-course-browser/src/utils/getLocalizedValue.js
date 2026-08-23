// src/utils/getLocalizedValue.js
import useDictionary from '../hooks/useDictionary'

const getLocalizedValue = (key) => {
	const dictionary = useDictionary()
	const trimmedKey = key.startsWith('$') ? key.slice(1) : key
	return dictionary?.uk[trimmedKey] ?? key
}

export default getLocalizedValue
