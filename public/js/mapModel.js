class MapModel {

	constructor(mapServerConnection) {
		this.blockData = {};

		this.connection = mapServerConnection;
	}

	calcPositionKey(pos) {
		return `${pos.x},${pos.y},${pos.z}`;
	}

	onLoadedNewBlock(blockData) {
		// TODO fire an event?
		console.info('Found a new block', blockData);
	}

	getBlock(position) {
		const key = this.calcPositionKey(position);

		return new Promise((resolve, reject) => {
			if (this.blockData[key]) {
				return new Promise((resolve, reject) => {
					resolve(this.blockData[key]);
				});
			}
			else {
				return this.connection.requestBlock(position)
					.then((blockData) => {
						this.blockData[key] = blockData;
						this.onLoadedNewBlock(blockData)
						return this.blockData[key];
					});
			}
		});
	}

	getChunk(position) {

	}
}

export { MapModel }