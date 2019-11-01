const path = require('path');
require("@babel/register");

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
					/(common|public)\/.*\.js/
				],
				use: ['babel-loader'],
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			}
		],
	},

	plugins: [],
	watch: true,
	devtool: "source-map",

};

module.exports = config;
