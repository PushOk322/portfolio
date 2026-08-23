import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import autoprefixer from 'autoprefixer'
import postcssPresetEnv from 'postcss-preset-env'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
	base: './',
	server: {
		port: 3000
	},
	plugins: [react(), tsconfigPaths(), svgr()],
	css: {
		postcss: {
			plugins: [autoprefixer(), postcssPresetEnv()]
		}
	},
	resolve: {
		alias: {
			'@media': path.resolve(__dirname, './src/styles/mixins/media.scss'),
			'@fontStyle': path.resolve(
				__dirname,
				'./src/styles/mixins/fontStyle.scss'
			),
			'@': path.resolve(__dirname, './src')
		}
	}
})
