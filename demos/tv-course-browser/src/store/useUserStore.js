import create from 'zustand'
import axios from 'axios'
import { loadState, saveState } from '../utils/localStorage.js'

// Define the initial state
const initialState = {
	authenticated: false,
	token: null,
	message: '',
	auth_code: '',
	last_request_status: '',
	email: '',
	key: null,
	error: null,
	user: {
		balance: null,
		country_code: null,
		email: null,
		groups: [],
		groupsIds: [],
		locale: 'uk',
		name: null,
		subscription: {
			id: null,
			active: false,
			expired_at: null,
			subscribe: false,
			server_time: null,
			payment_system: null,
			subscribe_product: {
				id: null,
				price: null,
				discount_price: null,
				discount_percent: null,
				currency: null,
				type: null,
				name: null,
				description: null,
				pool_promocode: null,
				pool_subscribe: {
					period: null,
					every: null,
					price: null
				}
			},
			key_info: null
		}
	}
}

// Load persisted state from localStorage or use the initial state
/**
 * Portfolio build: start signed in.
 *
 * The production app opened on a code-entry screen — you paired the TV with an account
 * on your phone before you could see anything. There is no account system here, so a
 * visitor would be stuck at a login wall that can never be satisfied. Seeding an
 * authenticated session drops them straight into the browsing UI, which is the part
 * worth showing. The auth screens are still in the build and still reachable.
 */
const demoSession = {
	...initialState,
	authenticated: true,
	token: 'demo-session',
	user: {
		...initialState.user,
		name: 'Demo viewer',
		email: 'demo@example.com',
		locale: 'en'
	}
}

const persistedState = loadState('userState') || demoSession

// Define the zustand store
const useUserStore = create((set, get) => ({
	...persistedState,

	setError: (error) =>
		set((state) => {
			const newState = { error }
			saveState('userState', { ...get(), ...newState })
			return newState
		}),

	setLocale: (locale) =>
		set((state) => {
			const newState = { user: { ...state.user, locale } }
			saveState('userState', { ...get(), ...newState })
			return newState
		}),

	setCode: (auth_code) =>
		set((state) => {
			const newState = { auth_code }
			saveState('userState', { ...get(), ...newState })
			return newState
		}),

	setEmail: (email) =>
		set((state) => {
			const newState = { email }
			saveState('userState', { ...get(), ...newState })
			return newState
		}),

	setKey: (key) =>
		set((state) => {
			const newState = { key }
			saveState('userState', { ...get(), ...newState })
			return newState
		}),

	setSubscription: (subscriptionData) =>
		set((state) => {
			const newState = {
				user: {
					...state.user,
					subscription: { ...subscriptionData }
				}
			}
			saveState('userState', { ...get(), ...newState })
			return newState
		}),

	authConfirm: async (credentials) => {
		set({ last_request_status: 'loading' })
		try {
			const response = await axios.post(
				`${process.env.WEBPACK_BASE_URL}v3/user/auth/confirm`,
				credentials
			)
			const newState = {
				authenticated: true,
				token: response.data.data.token,
				user: response.data.info.user,
				last_request_status: 'success'
			}
			set(newState)
			saveState('userState', { ...get(), ...newState })
		} catch (error) {
			const errorMessage = error.response?.data?.info?.message || error.message
			set({
				error: error.message,
				message: errorMessage,
				status: 'failed',
				last_request_status: 'failed'
			})
			throw error
		}
	},

	logout: async () => {
		set({ last_request_status: 'loading' })
		try {
			await axios.post(
				`${process.env.WEBPACK_BASE_URL}${process.env.WEBPACK_LOGOUT_API}`,
				null,
				{
					headers: { Authorization: `Bearer ${get().token}` }
				}
			)
			// Reset state to the initial state
			set(initialState)
			saveState('userState', initialState)
			localStorage.removeItem('userState')
		} catch (error) {
			set({
				last_request_status: 'failed',
				message: error.message
			})
		}
	},

	keyActivate: async (form) => {
		set({ last_request_status: 'loading' })
		try {
			const login = 'device'
			// Portfolio build: placeholder. The original shipped a hardcoded base64 Basic-auth
			// credential here — it decodes to Apigee's documentation example rather than a live
			// secret, but a credential literal has no business in shipped source either way.
			const password = 'demo-placeholder'
			const encodedCredentials = btoa(`${login}:${password}`)
			const response = await axios.post(
				`${process.env.WEBPACK_BASE_URL}subscribe/promocode`,
				form,
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Basic ${encodedCredentials}`
					}
				}
			)
			// Update subscription and clear any previous error
			get().setSubscription(response.data.data)
			console.log('🚀 ~ keyActivate: ~ response.data:', response.data)
			set({
				error: null,
				message: response.data.message,
				last_request_status: 'success',
				user: {
					...get().user,
					key_info: response.data
				}
			})
		} catch (error) {
			const errorMessage = error.response?.data?.info?.message || error.message

			get().setError(errorMessage)

			set({
				last_request_status: 'failed',
				message: errorMessage
			})

			throw new Error(errorMessage)
		}
	}
}))

export default useUserStore
