// Side-effect import, and it must come first: it swaps axios's adapter before any
// store module gets a chance to build its own instance.
import './services/mock-api.js'

import ReactDOM from 'react-dom/client'
import React from 'react'
import App from './App.jsx'
import { HashRouter } from 'react-router-dom'
import './styles/global.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
	<HashRouter>
		<App />
	</HashRouter>
)
