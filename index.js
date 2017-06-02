const fs = require('fs');
const path = require('path');

// Web server libraries
const express = require('express');
const http = require('http');
const WebSocket = require('socket.io');

// Minecraft libraries
const nbt = require('prismarine-nbt');
const worldFactory = require('prismarine-world');
const mcDataFactory = require("minecraft-data");
const Vec3 = require('vec3');

// const maxLevelHeight = mcData.type === 'pe' ? 128 : 255;

const MOVEMENT = {
	DOWN: new Vec3(0, -1, 0)
};

class MapDataServer {
	constructor(mapID) {
		this.mapDir = path.join(__dirname, "/map/", mapID);
		this.initWebServer();
		this.initMapServer();

		this.dataService = null;
		this.mapInstance = null;
	}

	initWebServer() {
		// Setup the websocket server
		// Express
		this.app = express();
		this.server = http.createServer(this.app);
		this.io = WebSocket(this.server);
		this.initSocketHandlers(this.io);

		// Setup static routes
		this.app.use(express.static(path.join(__dirname, 'public')));
		this.app.use('/js/lib/steal', express.static(path.join(__dirname, 'node_modules/steal')));

		this.server.listen(3000, function () {
			console.log('listening on port 3000!')
		});
	}

	initSocketHandlers(ioServer) {
		const self = this;
		ioServer.on('connection', client => {
			console.info('connected');
			client.on('blockRequest', (requestData) => {
				console.info('block request: ', requestData);
				return self.onBlockRequest(client, requestData);
			});
		});
	}

	initMapServer() {
		const regionPath = path.join(this.mapDir, 'region');

		let World,
			dataService,
			mapInstance;

		return this.getMcVersionFromMapData(this.mapDir).then((versionString) => {
			console.info('map version: ', versionString);
			World = worldFactory(versionString);
			this.dataService = mcDataFactory(versionString);
			this.mapInstance = new World(null, regionPath);
		}).catch((err) => {
			console.error(err);
		});
	}

	getMcVersionFromMapData(mapDir) {
		return new Promise((resolve, reject) => {
			fs.readFile(path.join(mapDir, "/level.dat"), function (error, data) {
				if (error) throw error;

				nbt.parse(data, function (error, data) {
					try {
						const versionString = data.value.Data.value.Version.value.Name.value;
						resolve(versionString);
					}
					catch (err) {
						console.error('ERROR getting version string from map data', err);
						reject(err);
					}
				});
			});
		});
	}

	onBlockRequest(client, requestData) {

		const self = this;
		console.log('blockRequest: ', requestData);
		const data = requestData;

		if (data.hasOwnProperty('x') && data.hasOwnProperty('y') && data.hasOwnProperty('z')) {
			let vec = new Vec3(data.x, data.y, data.z);
			this.getBlock(vec).then((blockData) => {
				console.info('send block 1: ', blockData);
				self.sendBlock(blockData, client);
			}).catch((err) => {
				console.error('Error getting block data: ', err);
			});

		}
		else if (data.hasOwnProperty('x') && data.hasOwnProperty('z')) {
			console.info('get highest block');
			this.getHighestBlock(data.x, 255, data.z).then((blockData) => {
				console.info('send block 2: ', blockData);
				self.sendBlock(blockData, client);

				// console.info('get the next few blocks down');
				// let nextPos = blockData.position.add(MOVEMENT.DOWN);
				// this.getBlocksYDeep(nextPos, 2).then(function (blockList) {
				// 	console.info('emit block list');
				// 	client.emit('blockList', blockList);
				// }).catch(function (error) {
				// 	console.info('ERROR: ', error);
				// });
			}).catch(err => {
				console.error('Error getting block data: ', err);
			});
		}
		else {
			// TODO operation not defined
			console.info('blockRequest operation not defined');
		}
	}

	getHighestBlock(xPos, nextYPos, zPos) {
		// nextYPos = nextYPos || 255;
		if (nextYPos < 0) {
			throw new Error('No blocks found at x:', xPos, ', z:', zPos);
		}

		return this.getBlock(new Vec3(xPos, nextYPos, zPos))
			.then(blockData => {
				if (blockData.block.type === 0) {
					return this.getHighestBlock(xPos, nextYPos - 1, zPos);
				}
				else {
					return blockData;
				}
			}).catch(err => {
				console.error(err);
			});
	}

	getBlocksYDeep(pos, depth) {
		// const finalPos = pos.minus(new Vec3(0, depth, 0));
		let nextPos = pos.clone(),
			blockRequests = [];

		do {
			nextPos = nextPos.minus(MOVEMENT.DOWN);

			let req = this.getBlock(nextPos).then((blockData) => {
				let block = this.addBlockAttributes(blockData.block);
				blockData.block = block;
				return blockData;
			}).catch(err => {
				console.error(err);
			});

			blockRequests.push(req);

		} while (nextPos.y >= pos.y - depth);

		return Promise.all(blockRequests);
	}

	sendBlock(blockData, client) {
		this.addBlockAttributes(blockData.block);
		console.info('Emit vlock to client: ', blockData);
		client.emit('blockData', blockData);
	}

	getBlock(vec3) {
		return this.mapInstance.getBlock(vec3).then(block => {
			return {block: block, position: vec3};
		}).catch(err => {
			console.error('Error finding block data:', err);
		});
	}

	// TODO this is mutating the parameter
	addBlockAttributes(block) {
		let extraData = this.dataService.blocks[block.type];
		block.transparent = extraData.transparent;
		return block;
	}

}

var mapServer = new MapDataServer('Qazzian1');
// var mapServer = new MapDataServer('abe');
