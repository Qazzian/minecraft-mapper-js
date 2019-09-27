const fs = require('fs');
const path = require('path');

const nbt = require('prismarine-nbt');

const region = require('./region');

const MAP_PATHS = {
	region: 'region',
};

class Map {
	constructor(mapName) {
		this.name = mapName;
		this.mapPath = Map.getMapPath(mapName, path.join(__dirname, '..', 'map'));
	}

	/**
	 * Load the Region NBT data from file
	 * @param {Number} x - Region x coordinate (east/west component)
	 * @param {Number} z - Region z coordinate (south/north component)
	 * @returns {*|Promise<unknown>|Promise|Promise|Promise}
	 */
	async loadRegion(x, z) {
		try {
			return await Map._loadRegion(this.mapPath, x, z);
		} catch (error) {
			console.error(error);
		}
	}

	async loadChunk(x,y) {
		const regionX = x;
		const regionY = y;

		const regionBuffer = await this.loadRegion(x, y);
		const chunkOffset = region.getByteOffset(regionX, regionY);
		const chunkDataOffset = region.readChunkLocationAtOffset(regionBuffer, chunkOffset);
		const chunkDataCompressed = region.getChunkData(regionBuffer, chunkDataOffset.offset, chunkDataOffset.size);
		const chunkData = await region.parseChunkData(chunkDataCompressed.data, chunkDataCompressed.compression);
		return chunkData;
	}

	async loadMetaData(name, dirBuilder) {
		const mapDir = dirBuilder(name);
		const mapPath = path.join(mapDir, "/level.dat");

		return new Promise((resolve, reject) => {
			fs.readFile(mapPath, (err, fileData) => {
				if (err) {
					reject(err);
				}

				nbt.parse(fileData, function (error, nbtData) {
					if (error) {
						reject(error);
					}
					resolve(nbtData);
				});
			});
		});
	}

	static getMapPath(mapId, rootPath, subDir) {
		const mapPath = path.join(rootPath, mapId);
		if (subDir in MAP_PATHS) {
			return path.join(mapPath, MAP_PATHS[subDir]);
		}
		return mapPath;
	}

	static getVersionString(metaData) {
		return metaData.value.Data.value.Version.value.Name.value;
	}

	static getVersionId(metaData) {
		return metaData.value.Data.value.Version.value.Id.value;
	}

	static _loadRegion(mapPath, regionX, regionZ) {
		return new Promise((resolve, reject) => {
			const regionFileName = `r.${regionX}.${regionZ}.mca`;
			const chunkPath = path.join(mapPath, MAP_PATHS.region, regionFileName);

			fs.readFile(chunkPath, (error, data) => {
				if (error) { return reject(error); }
				return resolve(data);
			});
		});
	}
}

function parseRegion(dataBuffer) {

}

module.exports = Map;
