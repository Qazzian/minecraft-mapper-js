const fs = require('fs');
const path = require('path');

const region = require('./region');

function readRegionSync() {
	const filename = path.join(__dirname, '../map/Qazzian1/region/r.0.0.mca');
	return fs.readFileSync(filename);
}

describe('Region file handling', () => {
	test('byte offsets', () => {
		expect(region.getByteOffset(0, 0)).toBe(0);
		expect(region.getByteOffset(1, 0)).toBe(4);
		expect(region.getByteOffset(0, 1)).toBe(128);
	});

	test('Read chunk location', () => {
		const testBuffer = Buffer.from([
			0, 2, 0x34, 1,
			0, 0, 0x57, 2,
			0, 2, 0xa6, 2,
			0, 2, 0x92, 1,
			0, 0, 0xf1, 1,
			0, 0, 0x32, 1,
		]);
		expect(region.readChunkLocationAtOffset(testBuffer, 0))
			.toMatchObject({offset: 564, size: 1});
		expect(region.readChunkLocationAtOffset(testBuffer, 4))
			.toMatchObject({offset: 87, size: 2});
	});

	test('loading a chunk from buffer', () => {
		const buffer = readRegionSync();
		const {offset, size} = region.readChunkLocationAtOffset(buffer, 0);
		expect(offset).toBe(564);
		expect(size).toBe(1);
		// buffer.
	});

	test('Reading chunk data', async () => {
		const buffer = readRegionSync();
		const rawChunkData = region.getChunkData(buffer, 2, 1);
		console.info('RAW CHUNK DATA:', rawChunkData);
		const processedChunkData = await region.parseChunkData(rawChunkData.data, rawChunkData.compression);
		console.info('Chunk Obj', processedChunkData);
	});

	test('Parse header', () => {
		const buffer = readRegionSync();
		const chunkLocations = region.parseHeader(buffer);
		// console.info('CHUNK LOCATIONS:', chunkLocations);
	});
});
