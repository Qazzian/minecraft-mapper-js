class QazzianMapServer {
	constructor(ioInterface, eventHandlers) {
		this.requests = {};

		let socket = this.socket = ioInterface(window.location.href);
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
			debugger;
			console.info('Chunk data: ', data);
		});
	}

	requestArea(x1, x2, z1, z2) {
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
