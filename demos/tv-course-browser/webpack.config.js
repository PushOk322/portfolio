const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')
const dotenv = require('dotenv')

// Load environment variables from .env file.
// `?? {}` matters here: there is no .env in this build (the endpoints it held are
// mocked), and dotenv returns `parsed: undefined` when the file is absent — the next
// line would then throw before webpack ever starts.
const env = dotenv.config().parsed ?? {}

// Ensure NODE_ENV is set consistently
env.NODE_ENV = process.env.NODE_ENV || 'development'

/**
 * Portfolio build: declare the endpoint variables even though there is no .env.
 *
 * DefinePlugin only substitutes the keys it is given. With none, every
 * `process.env.WEBPACK_*` in the stores survives into the bundle as a literal
 * `process` reference and throws `ReferenceError: process is not defined` the moment a
 * store tries to build a URL — which killed the course fetch silently, leaving the
 * header rendered and the page empty.
 *
 * The values are placeholders: src/services/mock-api.js intercepts every request
 * before the URL matters. They exist so the substitution happens at all.
 */
const MOCKED_ENDPOINTS = {
	WEBPACK_BASE_URL: 'https://mock.local/',
	WEBPACK_SCHEMA_API: 'v4/courses',
	WEBPACK_SCHEMA_AVAILABLE_API: 'v4/courses/available',
	WEBPACK_SCHEMA_OFFERT: 'v4/offert',
	WEBPACK_LOGOUT_API: 'v3/user/auth/logout',
	WEBPACK_AUTH_CONFIRM: 'v3/user/auth/confirm',
	WEBPACK_SERVE: 'false'
}

for (const [key, value] of Object.entries(MOCKED_ENDPOINTS)) {
	if (env[key] === undefined) env[key] = value
}

// Convert the env variables to the format required by DefinePlugin
const envKeys = Object.keys(env).reduce((prev, next) => {
	prev[`process.env.${next}`] = JSON.stringify(env[next])
	return prev
}, {})

const mode = env.NODE_ENV
const devMode = mode === 'development'
const target = devMode ? 'web' : 'browserslist'

const plugins = [
	new HtmlWebpackPlugin({
		template: path.join(__dirname, 'index.html')
	}),
	new MiniCssExtractPlugin({
		filename: '[contenthash].css'
	}),
	new webpack.DefinePlugin(envKeys),
	new CopyWebpackPlugin({
		patterns: [
			{
				from: path.resolve(__dirname, 'public/service-worker.js'),
				to: path.resolve(__dirname, 'dist/service-worker.js')
			}
		]
	})
]

let optimization = undefined

// Uncomment if you want to use optimization in production
// if (!devMode) {
//   optimization = {
//     splitChunks: {
//       chunks: 'all'
//     },
//     minimize: true,
//     minimizer: [new TerserPlugin({ parallel: true, minify: TerserPlugin.swcMinify })]
//   };
// }

module.exports = {
	mode,
	target,
	devServer: {
		port: 3030,
		open: true,
		hot: true,
		compress: true,
		client: {
			progress: true
		}
	},
	entry: [
		'core-js/stable',
		'regenerator-runtime/runtime',
		path.resolve(__dirname, 'src', 'main.jsx')
	],
	output: {
		path: path.resolve(__dirname, 'dist'),
		clean: true,
		filename: devMode ? '[name].js' : '[fullhash].js',
		assetModuleFilename: 'assets/[name][ext]'
	},
	plugins,
	resolve: {
		alias: {
			'@components': path.resolve(__dirname, 'src/components/'),
			'@utils': path.resolve(__dirname, 'src/utils/'),
			'@assets': path.resolve(__dirname, 'src/assets/'),
			'@media': path.resolve(__dirname, 'src/styles/mixins/media.scss')
			// Add more aliases as needed
		},
		extensions: ['.scss', '.js', '.jsx', '.json']
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							[
								'@babel/preset-env',
								{
									targets: '> 0.25%, not dead',
									useBuiltIns: 'entry',
									corejs: 3
								}
							],
							'@babel/preset-react'
						],
						plugins: [
							'@babel/plugin-transform-arrow-functions',
							'@babel/plugin-proposal-optional-chaining'
						]
					}
				}
			},
			{
				test: /\.html$/i,
				loader: 'html-loader'
			},
			{
				test: /\.(s[ac]|c)ss$/i,
				use: [
					devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: ['postcss-preset-env']
							}
						}
					}
				]
			},
			{
				test: /\.(s[ac])ss$/i,
				use: ['sass-loader']
			},
			{
				test: /\.(jpe?g|png|webp|gif|svg)?$/i,
				use: [
					{
						loader: 'image-webpack-loader',
						options: {
							mozjpeg: {
								progressive: true
							},
							optipng: {
								enabled: false
							},
							pngquant: {
								quality: [0.65, 0.9],
								speed: 4
							},
							gifsicle: {
								interlaced: false
							},
							webp: {
								quality: 75
							}
						}
					}
				],
				type: devMode ? 'asset' : 'asset/resource'
			},
			// Video only.
			//
			// The previous test was /\.mp4|.jpg$/i — an alternation whose second branch
			// is `.jpg$` with an unescaped dot, so it matched every JPEG too and sent it
			// to file-loader with outputPath 'video'. Together with the rule that
			// followed it (/\.jpg/i → outputPath 'img') and the image rule above, a
			// single .jpg was run through three loaders in a chain and emitted as a
			// 72-byte fragment. Every course image in the app rendered broken.
			{
				test: /\.mp4$/i,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: 'video'
						}
					}
				]
			},
			{
				test: /\.(woff(2)?|eot|ttf|otf)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'assets/fonts/[name][ext]'
				}
			},
			{
                test: /\.mp3$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'audio'
                        }
                    }
                ]
            }
		]
	},
	optimization
}
