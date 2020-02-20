const fs = require('fs');
const path = require('path');

// Web server libraries
const express = require('express');
const http = require('http');
const WebSocket = require('socket.io');

const PORT = 4001;

// Minecraft libraries
const nbt = require('prismarine-nbt');
const worldFactory = require('prismarine-world');
const mcDataFactory = require("minecraft-data");
const Vec3 = require('vec3');

const Map = require('./server/map');
const mcDataHandler = require('./server/mcDataHandler');

// const maxLevelHeight = mcData.type === 'pe' ? 128 : 255;

const MOVEMENT = {
	DOWN: new Vec3(0, -1, 0)
};

class MapDataServer {
	constructor(mapID) {
		this.mapDir = path.join(__dirname, "/map/", mapID);
		this.initWebServer();
		this.initMapServer();

		this.versionString = '';
		this.dataService = null;
		this.mapInstance = null;
		this.yMax = 255; // sane default, overwritten by initMapServer
	}

	initWebServer() {
		// Setup the websocket server
		// Express
		this.app = express();
		this.server = http.createServer(this.app);
		this.io = WebSocket(this.server);
		this.initSocketHandlers(this.io);

		this.server.listen(PORT, function () {
			console.log(`listening on port ${PORT}`)
		});
	}

	initSocketHandlers(ioServer) {
		const self = this;
		ioServer.on('connection', client => {
			console.info('connected');
			client.on('requestMinecraftVersion', () => {
				return self.onMapVersionRequest(client);
			})

			client.on('blockRequest', (requestData) => {
				console.info('block request: ', requestData);
				return self.onBlockRequest(client, requestData);
			});
			client.on('requestChunk', (req) => {
				console.info('Chunk Request: ', req);
				return this.onChunkRequest(client, req);
			});
			client.on('requestArea', (requestData) => {
				console.info('Area request: ', requestData);
				return self.onAreaRequest(client, requestData);
			});
			client.on('mcData', (requestData) => {
				console.info('mcData request:', requestData);
				return this.onMcDataRequest(client, requestData)
			})
		});
	}

	async initMapServer() {
		const regionPath = path.join(this.mapDir, 'region');

		try {
			this.metaData = await this.getMapMetaData(this.mapDir)
			console.info('map version: ', this.metaData.value.Data.value.Version.value.Name.value);
			this.versionString = this.metaData.value.Data.value.Version.value.Name.value;
			const World = worldFactory(this.versionString);
			this.dataService = mcDataFactory(this.versionString);
			this.mapInstance = new World(null, regionPath);
		} catch(err) {
			console.error(err);
		};
	}

	getMapMetaData(mapDir) {
		return new Promise((resolve, reject) => {
			fs.readFile(path.join(mapDir, "/level.dat"), function (error, data) {
				if (error) throw error;

				nbt.parse(data, function (error, data) {
					if (error) {
						return reject(error);
					}
					resolve(data);
				});
			});
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

	onMapVersionRequest(client) {
		const self = this;
		console.info('Version Request', this.versionString);
		client.emit('mcVersion', this.versionString);
	}

	onBlockRequest(client, requestData) {

		const self = this;
		console.log('blockRequest: ', requestData);
		const data = requestData;

		if (this.has3dPosition(data)) {
			let vec = new Vec3(data.x, data.y, data.z);
			this.getBlock(vec).then((blockData) => {
				console.info('send block 1: ', blockData);
				self.sendBlock(blockData, client);
			}).catch((err) => {
				console.error('Error getting block data: ', err);
			});

		}
		else if (this.has2dPosition(data)) {
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

	onChunkRequest(client, requestData) {
		// TODO
		console.info('TODO onChunkRequest');
		return this.handleChunkResponse(client, 'Qazzian1', 0, 0);
	}

	handleChunkResponse(client, mapId, x, z) {
		const map = new Map(mapId);
		const chunkData = map.loadChunk(0, 0);
		chunkData.then((chunkBuff) => {
			console.info('Emit chunk data:\n\n', chunkBuff, '\n\n');
			client.emit('chunkData', chunkBuff);
		});
	}

	/**
	 * send a stream of visible blocks within the given area
	 *
	 * @param client
	 * @param {object} requestData - set of north, south, east, west points on the map.
	 * @param {int} requestData.north - most northerly point (smallest z coord)
	 * @param {int} requestData.south - most southerly point (largest z coord)
	 * @param {int} requestData.east - largest x coord
	 * @param {int} requestData.west - smallest x coord
	 */
	onAreaRequest(client, requestData) {
		let x = requestData.west,
			z = requestData.north;
		const xMax = requestData.east,
			zMax = requestData.south;

		console.info('Area request: ', x, xMax, z, zMax);
		for (; x <= xMax; x++) {
			z = requestData.north;
			console.info('outer loop', x, xMax);
			for (; z <= zMax; z++) {
				console.info('inner loop', z, zMax);
				this.sendVisibleInColumn(client, x, this.yMax, z);
			}
		}
		console.info('Loops done: ', x, z);
	}

	onMcDataRequest(client, requestData) {
		const data = mcDataHandler(this.dataService, requestData);
		client.emit('mcData', {
			request: requestData,
			response: data,
		});
	}

	has3dPosition(data) {
		return data.hasOwnProperty('x') && data.hasOwnProperty('y') && data.hasOwnProperty('z')
	}

	has2dPosition(data) {
		return data.hasOwnProperty('x') && data.hasOwnProperty('z');
	}

	sendVisibleInColumn(client, x, yMax, z) {
		setTimeout(()=> {
			this.getHighestBlock(x, yMax, z).then(blockData => {
				this.sendBlock(blockData, client);
				if (this.isBlockTransparent(blockData.block)) {
					this.sendVisibleInColumn(client, x, blockData.position.y - 1, z);
				}
			}).catch(err => {
				console.error('Error in getHighestBlock: ', err);
			});
		}, 10);
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
				return blockData;
			}).catch(err => {
				console.error(err);
			});

			blockRequests.push(req);

		} while (nextPos.y >= pos.y - depth);

		return Promise.all(blockRequests);
	}

	sendBlock(blockData, client) {
		if (!blockData) {
			console.info('sendBlock called with no data!');
			return;
		}
		console.info('Emit block to client: ', blockData.position);
		client.emit('blockData', blockData);
	}

	async getBlock(vec3) {
		try {
			const block = await this.mapInstance.getBlock(vec3);
			this.addBlockAttributes(block);
			return {block: block, position: vec3};
		} catch(err) {
			console.error('Error finding block data:', err);
		}
	}

	isBlockTransparent(block) {
		if (block.hasOwnProperty('transparent')) {
			return block.transparent;
		}
		else {
			return this.dataService.blocks[block.type].transparent;
		}
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
