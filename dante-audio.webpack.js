const
	webpack = require('webpack'),
	path = require('path'),
	{ CleanWebpackPlugin } = require('clean-webpack-plugin'),
	CompressionPlugin = require('compression-webpack-plugin'),
	workboxPlugin = require('workbox-webpack-plugin'),
	date = require('date-and-time');
	
const now = new Date();	

module.exports = env => {
	return {
		entry: './dante-audio/app.js',
		performance: {
			hints: false,
			maxEntrypointSize: 6512000,
			maxAssetSize: 6512000
		},
		output: {
			path: path.resolve(__dirname, '_out'),
			filename: 'app.js'
		},
		module: {
			rules: [
				{
					test: /app\.manifest$/,
					use: [{ loader: 'file-loader', options: { name: 'manifest.json' } }]
				},{
					test: /\.(html|ogg|css|png|svg|jpe?g|gif|woff2?|ttf|eot)$/,
					use: [
						{ loader: 'file-loader', options: { name: '[name].[ext]' } }
					]
				}
			]
		},
		plugins: [
			new webpack.DefinePlugin({
				'__BUILD_TIMESTAMP__': JSON.stringify(date.format(now, 'YYYY-MM-DD HH:mm:ss'))
			}),
			new CleanWebpackPlugin(),
			new CompressionPlugin({
				test: /\.(css|js|html)$/i,
			}),
			new workboxPlugin.GenerateSW({
				swDest: 'sw.js',
				maximumFileSizeToCacheInBytes: 3000000,
				cleanupOutdatedCaches: true,
				exclude: [/\.(css|js|html)\.gz/],
				clientsClaim: true,
				skipWaiting: true,
			})
		]
	}
}
