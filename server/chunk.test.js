const chunk = require('./chunk');

const mockChunk = require('./__mock__/chunk');

describe('Chunk', () => {

	test('is defined', () => {
		expect(chunk).toBeDefined();
		expect(mockChunk).toBeDefined();
	});

	test('getSection', () => {
		expect(chunk.getSection).toBeDefined();
		const sectionZero = chunk.getSection(mockChunk, 0);
		expect(sectionZero).toBeDefined();
		expect(sectionZero).toMatchSnapshot();
	});

	test('parseSectionPalette', () => {
		expect(chunk.parseSectionPalette).toBeDefined();
		const sectionZero = chunk.getSection(mockChunk, 0);
		const sectionPalette = chunk.parseSectionPalette(sectionZero);
		expect(sectionPalette).toMatchSnapshot();
	});

	test('getBitDepth', () => {
		expect(chunk.getBitDepth(0)).toBe(4);
		expect(chunk.getBitDepth(2)).toBe(4);
		expect(chunk.getBitDepth(500)).toBe(9);
		expect(chunk.getBitDepth(16384)).toBe(15);
	});

	test('getIntFromLong', () => {
		const testLong = [0b00010001000000000000000000000000,
			0b00010001000000000000000000000000];
		expect(chunk.getIntFromLong(testLong, 0, 4)).toBe(1);
		expect(chunk.getIntFromLong(testLong, 4, 4)).toBe(1);
		expect(chunk.getIntFromLong(testLong, 32, 4)).toBe(1);
		expect(chunk.getIntFromLong(testLong, 36, 4)).toBe(1);

		const long2 = [0b00010000100001000010000100001000,
			0b01000010000100001000010000100001];
		expect(chunk.getIntFromLong(long2, 0, 5)).toBe(2);
		expect(chunk.getIntFromLong(long2, 5, 5)).toBe(2);
		expect(chunk.getIntFromLong(long2, 35, 5)).toBe(2);
		expect(chunk.getIntFromLong(long2, 30, 5)).toBe(2);

		const long3 = [0b11, 0b01000000000000000000000000000000];
		expect(chunk.getIntFromLong(long3, 30, 5)).toBe(0b11010);
	});


	test('blockStates.toInt', () => {
		const testStates = [
			// list of 2's in 5bits over 2 longs (
			[277094664, 1108378657],
			[138547332, 554189328],
		];
		const expected = [ 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0 ];
		const blockInts = chunk.blockStatesToInts(testStates, 5);

		expect(blockInts).toMatchObject(expected);

	});
});
