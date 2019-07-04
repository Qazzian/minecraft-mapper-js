const Map = require('./map');

const path = require('path');

const mapConfig = {
	getMapDir: function (mapId) {
		return path.join(__dirname, "../map/", mapId);
	}
};

const mapRoot = path.join(__dirname, "../map/");

describe('Map', () => {
	test('To be defined', () => {
		expect(Map).toBeDefined();
	});

	test('loading a PC/Java Map', async () => {
		const map = new Map('Qazzian1', mapConfig);
		expect(map).toBeDefined();
		const mapData = await map.loadMetaData('Qazzian1', mapConfig.getMapDir);
		expect(Map.getVersionString(mapData)).toBe('1.13.2');
		expect(Map.getVersionId(mapData)).toBe(1631);
	});


	test('Load block data', () => {
		expect(Map.getChunk()).toMatchObject({});
	});
});
