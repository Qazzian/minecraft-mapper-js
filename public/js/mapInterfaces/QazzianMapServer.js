const serverUrl = 'http://localhost:4001';
const region = require('../../../server/region');

// import { region } from '../../../server/region';

class QazzianMapServer {
	constructor(ioInterface, eventHandlers) {
		this.requests = {};

		let socket = this.socket = ioInterface(serverUrl);
		socket.on('connect', function () {
			console.log('Connected to Map server');
		});
		socket.on('disconnect', function () {
			console.log('Map server connection lost');
		});
		socket.on('blockData', function (data) {
			eventHandlers.onBlockReceived(data);
		});
		socket.on('blockList', function (data) {
			data.forEach(eventHandlers.onBlockReceived);
		});
		socket.on('chunkData', function (data) {
			const chunkNbt = data;
			console.info('Chunk data: ', chunkNbt);
		});
	}

	requestChunk(x, z) {
		this.socket.emit('requestChunk', {x, z});
	}

	requestArea(x1, x2, z1, z2) {
		return;
		console.info('requestArea: ', arguments);
		this.socket.emit('requestArea', {
			north: z1,
			south: z2,
			west: x1,
			east: x2
		});
	}

	requestTopBlock(x, z) {
		this.socket.emit('blockRequest', {x: x, z: z});
	}

	requestBlock(pos) {
		this.socket.emit('blockRequest', pos);
	}
}

export { QazzianMapServer }
