import React, { useEffect } from 'react'
import {
	useLocation,
	Navigate,
	Route,
	Routes,
	useNavigate
} from 'react-router-dom'
import { PATH } from './constants/index.js'
import Layout from './components/containers/layout/Layout.jsx'
import Loader from './components/widgets/layout/Loader/Loader.jsx'
import useGeneralStore from './store/useGeneralStore.js'
import useBannersStore from './store/useBannersStore.js'
import useUserStore from './store/useUserStore.js'
import useAuthStore from './store/useAuthStore.js'
import { isLGTV, isTizenTV, usePlatform } from './utils/usePlatform.js'
import { useSound } from './utils/useSound.js'
import { useKeyboard } from './utils/useKeyboard.js'
import { useWebOsHistory } from './utils/useWebOsHistory.js'
import { useTizenHistory } from './utils/useTizenHistory.js'
import { useCommonHistory } from './utils/useCommomHistory.js'

const Home = React.lazy(() => import('./components/pages/Home/Home.jsx'))
import Authorization from './components/pages/Authorization/Authorization.jsx'
import Courses from './components/pages/Courses/Courses.jsx'
import Course from './components/pages/Course/Course.jsx'
import CoursePreview from './components/pages/Courses/CoursePreview/CoursePreview.jsx'
import VideoPage from './components/pages/Video/Video.jsx'
import KeyActivation from './components/pages/KeyActivation/KeyActivation.jsx'
import Language from './components/pages/Language/Language.jsx'
import Logout from './components/pages/Logout/Logout.jsx'
import Offert from './components/pages/Offert/Offert.jsx'
import Account from './components/pages/Account/Account.jsx'

const App = () => {
	const location = useLocation()
	useEffect(() => {
		if (typeof window === 'undefined') {
			return
		}
		// Portfolio build: service worker registration removed. It exists for the packaged
		// TV app (offline start-up from the app bundle); served from a web subpath it just
		// fails to register and logs an error on every load, and there is nothing here
		// worth caching offline.
	}, [])

	const { authenticated, locale, token } = useUserStore((state) => ({
		authenticated: state.authenticated,
		locale: state.user.locale,
		token: state.token
	}))

	const { setAuthWay } = useAuthStore((state) => ({
		setAuthWay: state.setAuthWay
	}))

	const { fetchBanners } = useBannersStore((state) => ({
		fetchBanners: state.fetchBanners
	}))

	const { fetchData } = useGeneralStore((state) => ({
		fetchData: state.fetchData
	}))

	useEffect(() => {
		fetchData({
			locale,
			isAuthorized: authenticated,
			token
		})
		fetchBanners(locale)
	}, [fetchData, locale, token, authenticated])

	//------------------------------------------------------
	const { pathname } = useLocation()

	useEffect(() => {
		window.scrollTo(0, 0)
	}, [pathname])

	//adjusting-inputs-form-------------------------------------
	useKeyboard(location, isTizenTV)

	//environment--------------------------------------------
	usePlatform(location)

	//Инициализация звука с помощью Howler.js
	useSound(location)

	//--Webos-history--------------------------------------------------
	const navigate = useNavigate()
	useWebOsHistory(location, navigate, isLGTV)

	//Tizen-history----------------------------------------------
	useTizenHistory(location, navigate, isTizenTV)

	//CommonHistory--------------------------------------------
	useCommonHistory(location, isLGTV, isTizenTV)

	//auth-code-navigation------------------------------------
	useEffect(() => {
		if (location.pathname.startsWith(`/${PATH.ACCOUNT}`)) setAuthWay('')
	}, [location])

	return (
		<div className='app'>
			<Routes>
				<Route path={PATH.BASE} element={<Layout />}>
					<Route index element={<Navigate to={PATH.HOME} replace />} />
					<Route
						path={`${PATH.HOME}/*`}
						element={
							<React.Suspense fallback={<Loader />}>
								<Home />
							</React.Suspense>
						}
					/>
					<Route path={`${PATH.COURSES}/*`} element={<Courses />} />
					<Route
						path={`${PATH.COURSES}/${PATH.COURSE_PREVIEW}/:course_id`}
						element={<CoursePreview />}
					/>
					<Route path={`${PATH.COURSES}/:course_id`} element={<Course />} />
					<Route path={`${PATH.VIDEO}`} element={<VideoPage />} />
					<Route path={`${PATH.AUTH}/*`} element={<Authorization />} />
					<Route path={`${PATH.ACCOUNT}/*`} element={<Account />} />
					<Route path={PATH.KEYACTIVATION} element={<KeyActivation />} />
					<Route path={PATH.LANGUAGE} element={<Language />} />
					<Route path={PATH.LOGOUT} element={<Logout />} />
					<Route path={PATH.OFFERT} element={<Offert />} />
				</Route>
			</Routes>
		</div>
	)
}

export default App
