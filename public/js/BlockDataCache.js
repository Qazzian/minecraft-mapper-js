export default class BlockDataCache {
	constructor() {
		this.dataCache = {};
	}

	async get (blockName, fetchFunction) {

		if (this.dataCache.hasOwnProperty(blockName)) {
			return this.dataCache[blockName];
		}

		const blockData = await fetchFunction(blockName);
		this.dataCache[blockName] = blockData;

		return blockData;
	};
}


