import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'

import App from '@/App'
import { store } from '@/store/store'
import './styles/global.scss'

/**
 * No router and no PersistGate.
 *
 * Production had a HashRouter over ten screens (design, parts, trailers, tuning, six
 * auth screens, a personal cabinet) and redux-persist to survive the auth round trip.
 * This build is the configurator only, so there is one screen and nothing to persist.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
	<Provider store={store}>
		<App />
	</Provider>
)
