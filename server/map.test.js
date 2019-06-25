const Map = require('./map');

const path = require('path');

const mapConfig = {
	getMapDir: function (mapId) {
		return path.join(__dirname, "../map/", mapId);
	}
};

describe('Map', () => {
	test('To be defined', () => {
		expect(Map).toBeDefined();
	});

	test('loading a file', async () => {
		const map = new Map('Qazzian1', mapConfig);
		expect(map).toBeDefined();
		const mapData = await map.loadMetaData('Qazzian1', mapConfig.getMapDir);
		console.info('mapData: ', JSON.stringify(mapData));
	});
});
