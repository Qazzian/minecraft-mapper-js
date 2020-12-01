const serverUrl = 'http://localhost:4001';

class QazzianMapServer {
	constructor(ioInterface, eventHandlers) {
		this.requests = {};
		this.eventHandlers = {...eventHandlers};

		let socket = this.socket = ioInterface(serverUrl);
		socket.on('connect', function () {
			console.log('Connected to Map server');
		});
		socket.on('disconnect', function () {
			console.log('Map server connection lost');
		});
		socket.on('mcVersion', (data) => {
			console.info('MC VERSION: ', data);
			this.eventHandlers.onVersionReceived(data);
		});

		socket.on('blockData', function (data) {
			eventHandlers.onBlockReceived(data);
		});
		socket.on('blockList', function (data) {
			data.forEach(eventHandlers.onBlockReceived);
		});
		socket.on('chunkData', (data) => {
			const chunkNbt = data;
			console.info('Chunk data: ', chunkNbt);
			this.eventHandlers.onChunkReceived(chunkNbt);
			this.eventHandlers.onChunkReceived = eventHandlers.onChunkReceived;
		});

		socket.on('mcData', (data) => {
			// todo deal with error
			this.eventHandlers.onMcDataReceived(data.response);
		});
	}

	getMcVersion() {
		return new Promise((resolve, reject) => {
			this.eventHandlers.onVersionReceived = resolve;
			this.socket.emit('requestMinecraftVersion');
		})
	}

	requestChunk(x, z) {
		return new Promise((resolve, reject) => {
			this.eventHandlers.onChunkReceived = resolve;
			this.socket.emit('requestChunk', {x, z});
		});
	}
	//
	// requestArea(x1, x2, z1, z2) {
	// 	return;
	// 	console.info('requestArea: ', arguments);
	// 	this.socket.emit('requestArea', {
	// 		north: z1,
	// 		south: z2,
	// 		west: x1,
	// 		east: x2
	// 	});
	// }

	requestBlockData(blockName) {
		return new Promise((resolve, reject) => {
			this.eventHandlers.onMcDataReceived = resolve;
			this.socket.emit('mcData', {blockName});
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
