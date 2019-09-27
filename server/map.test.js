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


	xtest('Load region file', async () => {
		const mapPath = Map.getMapPath('Qazzian1', mapRoot);
		const regionData = await Map.loadRegion(mapPath, 0, 0);
		// console.info('REGION DATA: ', regionData);
	});

	// Don't worry about Bedrock edition for now
	// They changed the level format at some point so working out how to parse it will be a PITA
	xtest('loading a Bedrock Map', async () => {
		const map = new Map('Bedrock', mapConfig.getMapDir);
		expect(map).toBeDefined();
		const mapData = await map.loadMetaData('Bedrock', mapConfig.getMapDir, true);
		// console.info('mapData: ', JSON.stringify(mapData));
		expect(map.getVersionString(mapData)).toBe('1.1.1');
	});
});
