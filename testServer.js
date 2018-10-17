const fs = require('fs');
const path = require('path');

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

		this.dataService = null;
		this.mapInstance = null;
		this.yMax = 255; // sane default, overwritten by initMapServer
	}

	async onChunkRequest(client, requestData) {
		const self = this;
		const data = requestData;
		console.info('received chunk request:', requestData);
		if (this.has2dPosition(data)) {
			const chunkCoords = this.calcChunkCoord(data);
			console.info('chunk coords: ', chunkCoords);
			const chunkData = await this.getChunk(chunkCoords);
			console.info('chunk data: ', chunkData);

			// const chunkBlocks = this.getAllBlockFromChunk(chunkData);

			return this.sendChunk(chunkData, client);
		}
		return Promise.resolve();
	}


	has3dPosition(data) {
		return data.hasOwnProperty('x') && data.hasOwnProperty('y') && data.hasOwnProperty('z')
	}

	has2dPosition(data) {
		return data.hasOwnProperty('x') && data.hasOwnProperty('z');
	}

	calcChunkCoord(data) {
		return {
			x: Math.floor(data.x / 16),
			z: Math.floor(data.z / 16)
		}
	}

	sendVisibleInColumn(client, x, yMax, z) {
		this.getHighestBlock(x, yMax, z).then(blockData => {
			this.sendBlock(blockData, client);
			if (this.isBlockTransparent(blockData.block)) {
				this.sendVisibleInColumn(client, x, blockData.position.y - 1, z);
			}
		});
	}

	sendBlock(blockData, client) {
		console.info('Emit block to client: ', blockData.position);
		client.emit('blockData', blockData);
	}

	sendChunk(chunkData, client) {
		console.info('sending chunk data');
		client.emit('chunkData', chunkData);
	}

	getBlock(vec3) {
		return this.mapInstance.getBlock(vec3).then(block => {
			this.addBlockAttributes(block);
			return {block: block, position: vec3};
		}).catch(err => {
			console.error('Error finding block data:', err);
		});
	}

	async getChunk(chunkCoords) {
		console.log('map anvil loader: ', typeof this.mapInstance.anvil);

		const chunkBuffer = await this.mapInstance.getColumn(chunkCoords.x, chunkCoords.z);
		return chunkBuffer;
	}

	getAllBlockFromChunk(chunkData) {
		let blocks = [];

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
