import io from "socket.io";

class QazzianMapServer {
	constructor(eventHandlers) {
		let socket = this.socket = io(window.location.href);
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
	}

	requestTopBlock(x, z) {
		this.socket.emit('blockRequest', {x: x, z: z});
	}

	requestBlock(x, y, z) {
		this.socket.emit('blockRequest', {x: x, y: y, z: z});
	}
}

export { QazzianMapServer }
