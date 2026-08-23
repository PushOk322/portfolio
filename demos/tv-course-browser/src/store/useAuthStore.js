import create from 'zustand'
import axios from 'axios'

// Define the zustand store
const useAuthStore = create((set) => ({
	email: null,
	code: null,
	user: {},
	status: 'idle',
	error: null,
	auth_way: '',

	setEmail: (email) => set({ email }),
	setCode: (code) => set({ code }),
	setUser: (user) => set({ user }),
	setStatus: (status) => set({ status }),
	setError: (error) => set({ error }),
	setAuthWay: (auth_way) => set({ auth_way }),

	authConfirm: async (form) => {
		set({ status: 'loading' })
		try {
			const url = `${process.env.WEBPACK_BASE_URL}`
			const response = await axios.post(`${url}v3/user/auth/confirm`, form)
			console.log(response)
			set({ user: response.data, status: 'success' })
    	} catch (error) {
			console.error(error)
			set({ error: error.message, status: 'failed' })
			throw error
		}
	},

	loginUser: async (form) => {
		set({ status: 'loading' })
		try {
			const url = `${process.env.WEBPACK_BASE_URL}`
			const response = await axios.post(`${url}v3/user/auth`, form)
			set({ user: response.data, status: 'success' })
		} catch (error) {
			const errorMessage = error.response?.data?.info?.message || error.message
			set({ error: error.message, status: 'failed', message: errorMessage })
			throw error
		}
	},

	createUser: async (form) => {
		set({ status: 'loading' })
		try {
			const url = `${process.env.WEBPACK_BASE_URL}`
			const response = await axios.post(`${url}v3/user/register`, form)
			set({ user: response.data, status: 'success' })
		} catch (error) {
			const errorMessage = error.response?.data?.info?.message || error.message
			set({ error: error.message, status: 'failed', message: errorMessage })
		}
	},

	logoutUser: async () => {
		set({ status: 'loading' })
		try {
			const url = `${process.env.WEBPACK_BASE_URL}`
			await axios.post(`${url}v3/logout`, null, {
				headers: {
					'Content-Type': 'application/json'
				}
			})
			set({ user: {}, status: 'success' })
		} catch (error) {
			set({ error: error.message, status: 'failed' })
		}
	}
}))

export default useAuthStore
