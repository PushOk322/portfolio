import axios from 'axios'

export const fetcher = axios.create({
	baseURL: process.env.WEBPACK_BASE_URL
})
