const path = require('path');

const config = {
	entry: './public/js/mapper.js',

	output: {
		filename: 'mapper.bundle.js',
		path: path.join(__dirname, 'public/js_dist')
	},

	devtool: "cheap-eval-source-map"
};

module.exports = config;