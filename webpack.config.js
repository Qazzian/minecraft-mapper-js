const path = require('path');

require("@babel/register");

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
	entry: './public/js/mapper.js',

	output: {
		filename: 'mapper.bundle.js',
		path: path.join(__dirname, 'public/js_dist')
	},
	module: {
		rules: [
			{
				test: [
					/(common|public)\/.*\.js$/
				],
				use: ['babel-loader'],
			},
			// {
			// 	test: /\.json$/,
			// 	loader: 'json-loader'
			// },
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			}
		],
	},
	devServer: {
		contentBase: './public'
	},

	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			template: './public/index.html',
			filename: 'index.html'
		})
	],
	watch: true,
	devtool: "source-map",

};

module.exports = config;
