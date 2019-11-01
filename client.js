const fs = require('fs');
const path = require('path');

const express = require('express');
const http = require('http');

const PORT = 4000;

const webpack = require('webpack');
const webpackMiddleware = require("webpack-dev-middleware");
const webpackConfig = require("./webpack.config");
const webpackMiddlewareConfig = {
	publicPath: '/public/js_dist/',
	logLevel: 'trace',
};


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
		this.app.use(webpackMiddleware(webpack(webpackConfig), webpackMiddlewareConfig));

		// Setup static routes
		this.app.use(express.static(path.join(__dirname, 'public')));

		this.server.listen(PORT, function () {
			console.log(`listening on port ${PORT}`)
		});
	}
}

var clientServer = new ClientServer(PORT);
