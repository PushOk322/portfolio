import create from 'zustand'
import axios from 'axios'
import { loadState, saveState } from '../utils/localStorage.js'

// Initial state
const initialState = {
	status: 'idle',
	data: null,
	dictionary: null,
	isEmailModalOpen: false,
	isHeaderHidden: false,
	lastAccountOpenedTab: null,
	lastOpenedCourse: null,
	offert: null
}

const persistedState = loadState('general') || initialState

// Create the store
const useGeneralStore = create((set) => ({
	...persistedState,

	toggleEmailModalOpen: () =>
		set((state) => ({ isEmailModalOpen: !state.isEmailModalOpen })),

	toggleHeaderHidden: () =>
		set((state) => ({ isHeaderHidden: !state.isHeaderHidden })),

	setHeaderHidden: (isHidden) => set({ isHeaderHidden: isHidden }),
	setLastAccountOpenedTab: (lastAccountOpenedTab) =>
		set({ lastAccountOpenedTab: lastAccountOpenedTab }),
	setLastOpenedCourse: (lastOpenedCourse) =>
		set({ lastOpenedCourse: lastOpenedCourse }),

	fetchData: async ({ locale, isAuthorized, token }) => {
		set({ status: 'loading' })
		try {
			const coursesUrl = `${process.env.WEBPACK_BASE_URL}${process.env.WEBPACK_SCHEMA_API}?locale=${locale}`
			const authenticatedCoursesUrl = `${process.env.WEBPACK_BASE_URL}${process.env.WEBPACK_SCHEMA_AVAILABLE_API}?locale=${locale}`
			const fullCoursesResponse = await axios.get(coursesUrl)

			if (!isAuthorized) {
				set({
					status: 'success',
					data: fullCoursesResponse.data.data
				})
				saveState('general', {
					...persistedState,
					status: 'success',
					data: fullCoursesResponse.data.data
				})
				return
			}

			const headers = { Authorization: `Bearer ${token}` }
			const paidCoursesResponse = await axios.get(authenticatedCoursesUrl, {
				headers
			})

			const fullCoursesData = fullCoursesResponse.data.data
			const paidCoursesData = paidCoursesResponse.data.data

			const mergedCourses = fullCoursesData.map((course) => {
				const paidCourse = paidCoursesData.find((paid) => paid.id === course.id)
				return paidCourse ? paidCourse : course
			})

			set({
				status: 'success',
				data: mergedCourses
			})
			saveState('general', {
				...persistedState,
				status: 'success',
				data: mergedCourses
			})
		} catch (error) {
			console.error(error)
			set({ status: 'failed' })
		}
	}
}))

export default useGeneralStore
