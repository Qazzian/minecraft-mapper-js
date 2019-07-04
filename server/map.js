const fs = require('fs');
const path = require('path');

const nbt = require('prismarine-nbt');
const worldFactory = require('prismarine-world');

const MAP_PATHS = {
	region: 'region',
};

class Map {
	constructor(mapName, config) {
		this.name = mapName;
		this.config = config;
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

	static getChunk() {
		return {};
	}

}

module.exports = Map;
