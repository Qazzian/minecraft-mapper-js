const fs = require('fs');
const path = require('path');

const express = require('express');
const http = require('http');

const PORT = 4000;

const webpack = require('webpack');
const webpackMiddleware = require("webpack-dev-middleware");


class ClientServer {
	constructor(port) {
		this.app = null;
		this.server = null;

		this.init();
	}

	init () {
		this.app = express();
		this.server = http.createServer(this.app);

		// TODO DEVELOPMENT ONLY FOR WEBPACK
		this.app.use(webpackMiddleware(webpack({
			entry: './public/js/mapper.js',
			output: {
				filename: 'mapper.bundle.js',
				path: path.join(__dirname, 'public/js_dist')
			}
		}),{
			publicPath: '/public/js_dist/',
		}));

		// Setup static routes
		this.app.use(express.static(path.join(__dirname, 'public')));

		this.server.listen(PORT, function () {
			console.log(`listening on port ${PORT}`)
		});
	}
}

var clientServer = new ClientServer(PORT);
