var path = require('path');

// Web server libraries
const express = require('express');
const http = require('http');
// const url = require('url');
const WebSocket = require('socket.io');


// Minecraft libraries
var World = require('prismarine-world')("1.11.2");
var mcData=require("minecraft-data")("1.11.2");
var Vec3 = require('vec3');

var regionPath = path.join(__dirname, "/map/region");

var world = new World(null, regionPath);

var cols = world.getColumns();


// Setup the websocket server
// Express
const app = express();
const server = http.createServer(app);
//Websocket
var io = WebSocket(server);
io.on('connection', function(client){
	console.log('Socket.IO connection established');

	client.on('blockRequest', function(data){
		// console.log('blockRequest: ', data);
		if (data.hasOwnProperty('x') && data.hasOwnProperty('y') && data.hasOwnProperty('z')) {
			getBlock(data.x, data.y, data.z).then(function(blockData){
				sendBlock(blockData, client);
			});

		}
		else if (data.hasOwnProperty('x') && data.hasOwnProperty('z')) {
			var block = getHighestBlock(data.x, 255, data.z).then(function(blockData) {
				sendBlock(blockData, client);

				nextPos = [blockData.position[0], blockData.position[1]-1, blockData.position[2]];
				getBlocksYDeep(nextPos, 2).then(function(blockList){
					client.emit('blockList', blockList);
				}).catch(function(error){
					console.info('ERROR: ', error);
				});
			});
		}
		else {
			// TODO operation not defined
		}
	});

 });
server.listen(3000, function () {
  console.log('listening on port 3000!')
});

// Setup static routes
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js/lib/steal', express.static(path.join(__dirname, 'node_modules/steal')));

// TODO loop until we find first non-air block (block.type != 0)

function getHighestBlock(xPos, nextYPos, zPos) {
	// nextYPos = nextYPos || 255;
	if (nextYPos < 0) {
		throw new Error('No blocks found at x:', xPos, ', z:', zPos);
	}

	return world.getBlock(new Vec3(xPos,nextYPos,zPos))
		.then(function(blockData){
			if (blockData.type === 0) {
				return getHighestBlock(xPos, nextYPos -1, zPos);
			}
			else return {block: blockData, position: [xPos, nextYPos, zPos]};
	});
}

function getBlocksYDeep(pos, depth) {
	var y,
		// endY = Math.max(pos[1] - depth, 0),
		blockRequests = [];

	for (y = pos[1]; blockRequests.length<=depth; y--) {
		// TODO skip air blocks
		let req = getBlock(pos[0], y, pos[2]).then(function(blockData){
			var block = addBlockAttributes(blockData.block);
			blockData.block = block;
			return blockData;
		});
		blockRequests.push(req);

	}

	return Promise.all(blockRequests);
}

function sendBlock(blockData, client) {
	var block = addBlockAttributes(blockData.block);
	client.emit('blockData', {block: block, position: blockData.position});
}

function getBlock(x, y, z) {
	return world.getBlock(new Vec3(x,y,z)).then(function(blockData){
		return {block: blockData, position: [x, y, z]};
	});
}

function addBlockAttributes(block) {
	var extraData = mcData.blocks[block.type];
	block.transparent = extraData.transparent;
	return block;
}

getHighestBlock(0, 255, 0).then(function(highestBlock){
	addBlockAttributes(highestBlock.block);
	console.log('highestBlock:', JSON.stringify(highestBlock, null, 4));
});

// world.getBlock(new Vec3(0,yPos,0))
//   .then(function(block){
//     console.log('BLOCK: ', JSON.stringify(block,null,2));
//   })
//   .then(function(){
//     world.stopSaving();
//     process.exit();
//   })
//   .catch(function(err){
//     console.log(err.stack);
//   });

