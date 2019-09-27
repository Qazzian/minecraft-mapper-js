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
			const {offset, size} = readChunkLocationAtOffset(buff, headerOffset);
			locations.push({
				offset,
				size,
				x,
				z,
			});
		}
	}

	function pm(p) { return (p.x<<8)+ p.z }
	return locations.sort((a,b) => {return pm(a) - pm(b)});
}


function readChunkLocationAtOffset(buff, headerOffset) {
	const offset= buff.readUInt32BE(headerOffset) >> 8;
	const size = buff.readUInt8(headerOffset+3);
	return {offset, size};
}


const SECTOR_SIZE = 4 * 1024; // 4KiB
// Offset and size should represent a number of 4Kib sectors.
function getChunkData(buff, offset, size) {
	const byteOffset = offset * SECTOR_SIZE;
	const byteSize = size * SECTOR_SIZE;
	const chunkBuff = buff.slice(byteOffset, byteOffset + byteSize);
	return {
		length: chunkBuff.readUInt32BE(0),
		compression: chunkBuff.readUInt8(4),
		data: chunkBuff.slice(5, chunkBuff.length),
	};
}

function parseChunkData(buff, compressMode) {
	return new Promise((resolve, reject) => {
		// TODO support compress mode 1
		if (compressMode != 2) {
			reject( new Error('Unsupported compression:', compressMode))
		}

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

