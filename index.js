var path = require('path');

// Web server libraries
const express = require('express');
const http = require('http');
// const url = require('url');
const WebSocket = require('socket.io');


// Minecraft libraries
var World = require('prismarine-world')("1.11.2");
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
			// TODO
		}
		else if (data.hasOwnProperty('x') && data.hasOwnProperty('z')) {
			var block = getHighestBlock(data.x, 255, data.z).then(function(blockData) {
				if (blockData.block.meta) {
					console.log('BLOCK META: ', blockData.block.name, blockData.block.meta)
				}

				client.emit('blockData', blockData);
				nextPos = [blockData.position[0], blockData.position[1]-1, blockData.position[2]];
				getBlocksYDeep(nextPos, 5).then(function(blockList){
					console.log('Block Y Deep: ', blockList.length);
					client.emit('blockList', blockList);
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
		blockRequests.push(getBlock(pos[0], y, pos[2]));
	}

	return Promise.all(blockRequests);
}

function getBlock(x, y, z) {
	return world.getBlock(new Vec3(x,y,z)).then(function(blockData){
		return {block: blockData, position: [x, y, z]};
	});
}

getHighestBlock(0, 255, 0).then(function(highestBlock){
	console.log('highestBlock:', highestBlock);
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

