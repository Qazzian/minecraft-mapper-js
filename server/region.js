const zlib = require('zlib');

const nbt = require('prismarine-nbt');

function getByteOffset(x, z) {
	return 4 * ((x % 32) + (z % 32) * 32);
}

function parseHeader(buff) {
	const locations = [];

	for (let x = 0; x<32; x++) {
		for (let z = 0; z<32; z++) {
			const headerOffset = getByteOffset(x, z);
			locations.push({
				...readChunkLocationAtOffset(buff, headerOffset),
				x,
				z,
			});
		}
	}

	return locations.sort((a,b) => {return a.offset - b.offset});
}



function readChunkLocationAtOffset(buff, headerOffset) {
	const offset= buff.readUInt32BE(headerOffset) >> 8;
	// console.info('readChunkLocationAtOffset: ', offset);
	const size = buff.readUInt8(headerOffset+3);
	return {offset, size};
}


const SECTOR_SIZE = 4 * 1024; // 4KiB
// Offset and size should represent a number of 4Kib sectors.
function getChunkData(buff, offset, size) {
	const byteOffset = offset * SECTOR_SIZE;
	const byteSize = size * SECTOR_SIZE;
	console.info('getChunkData: ', byteOffset, byteSize, byteOffset + byteSize);
	console.info('getChunkData: 0x%s 0x%s', byteOffset.toString(16), (byteOffset + byteSize).toString(16));
	const chunkBuff = buff.slice(byteOffset, byteOffset + byteSize);
	return {
		length: chunkBuff.readUInt32BE(0),
		compression: chunkBuff.readUInt8(4),
		data: chunkBuff.slice(5, chunkBuff.length),
	};
}

function parseChunkData(buff, compressMode) {
	// TODO support compress mode 1
	if (compressMode != 2) { return new Error('Unsupported compression:', compressMode)}
	return new Promise((resolve, reject) => {
		zlib.unzip(buff, function(error, uncompressed){
			if (error) {
				reject(error);
			}
			nbt.parse(uncompressed, function (error, nbtData) {
				if (error) {
					reject(error);
				}
				resolve(nbtData);
			});
		})

	});
}

module.exports = {
	parseHeader: parseHeader,
	getByteOffset: getByteOffset,
	readChunkLocationAtOffset: readChunkLocationAtOffset,
	getChunkData: getChunkData,
	parseChunkData: parseChunkData,
};

