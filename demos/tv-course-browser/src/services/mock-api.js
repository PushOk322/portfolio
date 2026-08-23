import axios from 'axios'

import { banners, courses, offert, user } from './fixtures'

/**
 * Mock network layer — portfolio build.
 *
 * The app talked to a course platform's REST API through seven Zustand stores. Rather
 * than editing all seven, this installs a custom axios adapter: every request the app
 * makes is matched on its URL and answered from a fixture. Nothing leaves the browser,
 * and every store keeps the code it shipped with — the request/response contract is
 * the seam, exactly as it was in production.
 *
 * Imported once, for its side effect, at app entry.
 *
 * Fixture data is invented. Course titles, durations and descriptions are made up;
 * the shapes are the real ones, derived from what the components read
 * (`course.videos`, `course.preview_fullscreen`, `video.is_paid`, and so on).
 */

const ROUTES = [
	// The two course endpoints differ only in whether they return purchased courses.
	// Both answer with the same catalogue here — the demo has no purchases to reflect.
	{ test: (url) => /courses|schema/i.test(url), body: { data: courses } },
	{ test: (url) => /banners/i.test(url), body: { data: banners } },
	{ test: (url) => /offert/i.test(url), body: { data: offert } },
	{ test: (url) => /auth\/confirm|auth|login/i.test(url), body: user },
	{ test: (url) => /logout/i.test(url), body: { success: true } },
	{ test: (url) => /user/i.test(url), body: { data: user } },
	// Anything left over resolves empty rather than rejecting: a store that throws
	// leaves a spinner on screen forever, which reads as a broken demo.
	{ test: () => true, body: { data: [] } }
]

function respond(config) {
	const url = `${config.baseURL ?? ''}${config.url ?? ''}`
	const route = ROUTES.find((entry) => entry.test(url))

	return new Promise((resolve) => {
		// A beat of latency so loading states are visible rather than skipped.
		setTimeout(() => {
			resolve({
				data: route.body,
				status: 200,
				statusText: 'OK',
				headers: {},
				config
			})
		}, 120)
	})
}

axios.defaults.adapter = respond

// Stores that built their own instance before this module ran keep the real adapter,
// so patch the shared create() too.
const originalCreate = axios.create.bind(axios)
axios.create = (config = {}) => {
	const instance = originalCreate(config)
	instance.defaults.adapter = respond
	return instance
}

console.info('TV_DEMO: network mocked — no requests leave the browser.')
