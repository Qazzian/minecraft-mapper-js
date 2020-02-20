module.exports = function (dataServer, requestData) {
	if (requestData.blockName) {
		return getBlockByName(requestData.blockName);
	}
};

function getBlockByName(dataServer, blockName) {
	if (dataServer.blocksByName.hasOwnProperty(blockName)) {
		return dataServer.blocksByName[blockName];
	}
}
