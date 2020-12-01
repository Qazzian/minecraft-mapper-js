module.exports = function (dataServer, requestData) {
	console.info('MC DATA REQUEST: ', requestData);
	if (requestData.blockName) {
		return getBlockByName(dataServer, requestData.blockName);
	}
};

function getBlockByName(dataServer, blockName) {
	if (dataServer.blocksByName.hasOwnProperty(blockName)) {
		return dataServer.blocksByName[blockName];
	}
	const [prefix, postfix] = blockName.split(':');
	if (prefix === 'minecraft' && dataServer.blocksByName.hasOwnProperty(postfix)) {
		return dataServer.blocksByName[postfix];
	}

	throw Error(`Block name ${blockName} not recognised`);
}
