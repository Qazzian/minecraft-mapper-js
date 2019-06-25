const fs = require('fs');
const path = require('path');

const nbt = require('prismarine-nbt');

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
				if (err) {reject(err);}

				nbt.parse(fileData, function (error, nbtData) {
					if (error) { reject(error); }
					resolve(nbtData);
				});
			});
		});
	}
}

module.exports = Map;
