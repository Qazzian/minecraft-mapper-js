
import io from "socket.io";
import * as THREE from "three";


import { SceneRenderer } from "SceneRenderer";
import { BlockRenderer } from "BlockRenderer";

"use strict";

// Note about Axis in Three.js
// X is left - right, west - east
// Y is up - down
// Z is forward and back, north & south

// Sea level: Y=64

console.log('THREE.REVISION: ', THREE.REVISION);
THREE.Cache.enabled = true;

const debugMode = false;

class Mapper {
	constructor() {
		this.sceneRenderer = new SceneRenderer();
		this.scene = this.sceneRenderer.scene;

		this.blockRenderer = new BlockRenderer();

		this.meshByMaterial = {};
		this.meshByChunk = {};
		if (debugMode) {
			this.addDebugObjects();
		}
	}

	start() {
		this.sceneRenderer.animate();
	}

	addDebugObjects() {
		sceneRenderer.addAxisLines(pos);
	}

	positionCamera(cameraPos, targetPos) {
		console.info('pos cam', cameraPos, targetPos);
		this.sceneRenderer.positionCamera(cameraPos, targetPos);
	}

// TODO use a webWorker to process the block data queue and add elements to the scene
	addBlockData(blockData) {
		this.blockRenderer.render(blockData).then(modelData => {
			modelData.block = blockData.block;
			modelData.position = blockData.position;
			this.addToScene(modelData);
		});
	}

	addBlockList(blocks) {
		blocks.forEach((blockData) => {
			if (blockData.block.type !== 0) {
				setTimeout(() => {
					this.addBlockData(blockData);
				}, 0);
			}
		});
	}

	addToScene(modelData) {
		return this.addByMaterial(modelData);
	}

	addByMaterial (modelData) {
		const geometry = modelData.geometry;
		const material = modelData.material;

		const materialKey = material.key || material.uuid;

		if (this.meshByMaterial[materialKey]) {
			let geom = this.meshByMaterial[materialKey].geometry;
			geom.merge(geometry);

			geom.elementsNeedUpdate = true;
			geom.verticesNeedUpdate = true;
			geom.uvsNeedUpdate = true;
			geom.normalsNeedUpdate = true;
			geom.colorsNeedUpdate = true;
			geom.lineDistancesNeedUpdate = true;
			geom.groupsNeedUpdate = true;
			geom.computeBoundingSphere();
		}
		else {
			let mesh = new THREE.Mesh(geometry, material);
			this.meshByMaterial[materialKey] = mesh;
			this.scene.add(mesh);
		}
	}

	addByChunck (modelData) {
		const position = modelData.position;
		const geometry = modelData.geometry;
		const material = modelData.material;

		const chunkX = Math.floor(modelData.position[0] / 16);
		const chunkZ = Math.floor(modelData.position[2] / 16);
		const chunkKey = `chunk-${chunkX}-${chunkZ}`;

		if (this.meshByChunk[chunkKey]) {
			// TODO do merge
		}
		else {
			// TODO new mesh
		}
		/*
		 The X of chunk will be Floor( X coordinate / 16 )
		 The Z of chunk will be Floor( Z coordinate / 16 )

		 TODO
		 */
	}

}


const mapper = new Mapper();
// mapper.start();

let scene = mapper.scene;

let socket = io(window.location.href);
// let socket = io('http://www.qazzian.com:3000/');

socket.on('connect', function () {
});

socket.on('blockData', function (data) {
	// TODO add block data to a queue
	mapper.addBlockData(data);
});
socket.on('blockList', function (data) {
	mapper.addBlockList(data);
});
socket.on('disconnect', function () {
});

function requestBlocks(x, z) {
	socket.emit('blockRequest', {x: x, z: z}, function (blockData) {
	});
}
function requestBlock(x, y, z) {
	socket.emit('blockRequest', {x: x, y: y, z: z}, function (blockData) {
	});
}

// TODO moving all the code into the mapper class




function addBlockList(blocks) {
	blocks.forEach(function (blockData) {
		if (blockData.block.type !== 0) {
			setTimeout(function () {
				addBlockData(blockData);
			}, 0);
		}
	});
}


function generateCubesAsync() {
	let dist = 4;
	// let origin = [0,0];
	let origin = [0, 0];
	let camHeight = 75;
	let camOffset = [10, 10, 10];

	// todo find the y pos of the origin block

	let x, z = 0;

	for (x = origin[0] - dist; x <= origin[0] + dist; x++) {
		for (z = origin[1] - dist; z <= origin[1] + dist; z++) {
			requestBlocks(x, z);
		}
	}
	mapper.positionCamera([origin[0] + camOffset[0], camHeight + camOffset[1], origin[1] + camOffset[2]],
		[origin[0], camHeight, origin[1]]);

	// For testing a single block
	// requestBlock(78,105,308);
	// positionCamera([88,115,318], [78,105,308]);

}


function onObjectSelected(intersected) {
	console.log(intersected.object.data);
}

generateCubesAsync();
mapper.start();
