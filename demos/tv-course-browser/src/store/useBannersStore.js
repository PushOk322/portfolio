import create from 'zustand'
import axios from 'axios'

const useBannersStore = create((set) => ({
	status: 'idle',
	banners: {},
	error: null,
	fetchBanners: async (locale) => {
		set({ status: 'loading' })
		try {
			const url = `${process.env.WEBPACK_BASE_URL}v4/banners?/locale=${locale}`
			const response = await axios.get(url)
			set({
				status: 'succeeded',
				banners: response.data
			})
		} catch (error) {
			console.error(error)
			set({
				status: 'failed',
				error: error.message
			})
		}
	}
}))

export default useBannersStore
