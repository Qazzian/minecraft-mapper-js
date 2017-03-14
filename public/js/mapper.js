import $ from "jquery";
import io from "socket.io";
import * as THREE from "three";

import { OrbitControls } from "OrbitControls";

import { Textures } from "Textures";
import LayeredTexture from "LayeredTexture";
import { BlockState } from "blockState";

"use strict";

// Note about Axis in Three.js
// X is left - right, west - east
// Y is up - down
// Z is forward and back, north & south

// Sea level: Y=64

console.log('THREE.REVISION: ', THREE.REVISION);
THREE.Cache.enabled = true;

let clock = new THREE.Clock();
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 1000);

window.scroll(0, 0);
let renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let socket = io('http://localhost:3000');
socket.on('connect', function () {
});
socket.on('blockData', function (data) {
	addBlockData(data);
});
socket.on('blockList', function (data) {
	addBlockList(data);
});
socket.on('disconnect', function () {
});

function requestBlocks(x, z) {
	socket.emit('blockRequest', {x: x, z: z}, function (blockData) {
		// console.log('blockRequest: ', blockData);
	});
}
function requestBlock(x, y, z) {
	socket.emit('blockRequest', {x: x, y: y, z: z}, function (blockData) {
		// console.log('blockRequest: ', blockData);
	});
}

function addAxisLines(pos) {
	let axisHelper = new THREE.AxisHelper(10);
	axisHelper.translateX(pos[0]);
	axisHelper.translateY(pos[1]);
	axisHelper.translateZ(pos[2]);
	scene.add(axisHelper);
}

let modelDataCache = {};

function loadModelData(modelName) {
	// TODO change this to cache the promise function, ATM we are making multiple requests to the same file.

	if (modelDataCache.hasOwnProperty(modelName)) {
		return modelDataCache[modelName];
	}

	let request = $.getJSON('/models/' + modelName + '.json').then(function (modelData) {
		if (modelData.parent) {
			return loadModelData(modelData.parent).then(function (parentModel) {
				let combinedModelData = $.extend(true, {}, parentModel, modelData);
				// modelDataCache[modelName] = combinedModelData;
				return combinedModelData;
			});
		}
		else {
			// modelDataCache[modelName] = modelData;
			return modelData;
		}
	});
	modelDataCache[modelName] = request;

	return request;
}

function getFaceData(modelData) {
	if (!modelData.textures || !modelData.elements) {
		console.error("missing modelData. Expecting textures and elements: ", modelData);
	}

	let faces = {};

	modelData.elements.forEach(function (element) {
		Object.keys(element.faces).forEach(function (faceName) {
			if (!faces.hasOwnProperty(faceName)) {
				faces[faceName] = [];
			}
			let face = element.faces[faceName];
			let textureName = face.texture.replace(/^#/, '');
			face.texturePath = modelData.textures[textureName] || modelData.textures['all'];
			while (face.texturePath.match(/^#/)) {
				face.texturePath = modelData.textures[face.texturePath.replace(/^#/, '')];
			}
			faces[faceName].push(face);

		});
	});

	return faces;
}

let faceCache = {};

function renderFace(face, textureMap, block) {
	let baseColor;
	let cacheKey = [block.name, face[0].texturePath, block.biome.name].join('|');

	if (faceCache[cacheKey]) {
		return faceCache[cacheKey];
	}

	// console.info('RENDER FACE:', cacheKey, face, textureMap, block);

	if (face.length === 1) {
		baseColor = face[0].hasOwnProperty('tintindex') ? Textures.getTintColour(block) : 0xffffff;
		faceCache[cacheKey] = new THREE.MeshBasicMaterial({
			color: baseColor,
			map: textureMap[face[0].texturePath],
			alphaTest: 0.5,
			side: THREE.DoubleSide
		});
		return faceCache[cacheKey];
	}
	else if (face.length > 1) {
		let faceLayerList = [];
		face.forEach(function (faceLayer) {
			let texture;
			if (faceLayer.hasOwnProperty('tintindex')) {
				texture = Textures.generateTintedTexture(faceLayer.texturePath,
					textureMap[faceLayer.texturePath],
					Textures.getTintColour(block));
			}
			else {
				texture = textureMap[faceLayer.texturePath];
			}
			faceLayerList.push(texture);
		});
		faceCache[cacheKey] = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			map: new LayeredTexture(faceLayerList),
			alphaTest: 0,
			side: THREE.DoubleSide
		});
		return faceCache[cacheKey];
	}
}

// TODO cache materials so they can be applied to multiple blocks
// TODO see http://learningthreejs.com/blog/2011/09/16/performance-caching-material/
function generateBlockMaterials(faceData, textureMap, block) {
	var materials = [
		renderFace(faceData.east, textureMap, block), // right, east
		renderFace(faceData.west, textureMap, block), // left, west
		renderFace(faceData.up, textureMap, block), // top
		renderFace(faceData.down, textureMap, block), // bottom
		renderFace(faceData.south, textureMap, block), // back, south
		renderFace(faceData.north, textureMap, block)  // front, north
	];

	return new THREE.MultiMaterial(materials);
}

function addBlockList(blocks) {
	// console.log('BLOCK LIST:', blocks);
	blocks.forEach(function (blockData) {
		if (blockData.block.type !== 0) {
			setTimeout(function () {
				addBlockData(blockData);
			}, 0);
		}
	});
}

function addBlockData(blockData) {
	let block = blockData.block;
	let biome = block.biome;
	let stateName,
		variantIndex,
		blockModel,
		blockFaces,
		blockTextures;

	if (block.type === 8 || block.type === 9) {
		return addWaterBlock(blockData);
	}

	BlockState.loadBlockStates(block).then(function (variant) {
		return loadModelData('block/' + variant.model);
	}).catch(function (blockError) {
		console.error('Error loading block: ', block.name, blockData, blockError);
	}).then(function (modelDataResponse) {
		blockModel = modelDataResponse;
		blockFaces = getFaceData(modelDataResponse);
		var texturePathsList = Textures.getTexturesForBlock(blockFaces);
		return Textures.loadTextureListAsync('textures/', texturePathsList);
	}).then(function (textureList) {
		blockTextures = textureList;
		if (blockFaces.up && blockFaces.down) {
			let renderedBlock = buildStandardBlock(blockData, blockModel, blockFaces, textureList, biome);
			scene.add(renderedBlock);
		}
		else {
			// It's probably a cross shape
			let [ewMesh, nsMesh] = buildCrossBlock(blockData, blockFaces, textureList);
			scene.add(ewMesh, nsMesh);
		}

	});
}

function buildStandardBlock(blockData, blockModel, blockFaces, textureList) {

	const pos = blockData.position;
	const elementData = blockModel.elements[0];
	let geometrySizes = {
		x: (elementData.to[0] - elementData.from[0]) / 16,
		y: (elementData.to[1] - elementData.from[1]) / 16,
		z: (elementData.to[2] - elementData.from[2]) / 16
	};
	let heightCorrection = (1 - geometrySizes.y) / 2;

	let geometry = new THREE.BoxBufferGeometry(geometrySizes.x, geometrySizes.y, geometrySizes.z);
	geometry.translate(pos[0], pos[1] - heightCorrection, pos[2]);
	let materials = generateBlockMaterials(blockFaces, textureList, blockData.block);
	let renderedBlock = new THREE.Mesh(geometry, materials);
	renderedBlock.data = blockData;

	return renderedBlock;
}

function buildCrossBlock(blockData, blockFaces, textureList) {
	let material = new THREE.MeshBasicMaterial(renderFace(blockFaces.east, textureList, blockData.block));
	const pos = blockData.position;
	let ewGeom = new THREE.PlaneGeometry(1, 1);

	ewGeom.translate(pos[0], pos[1], pos[2]);
	let ewMaterials = new THREE.MultiMaterial([
		material, // right, east
		material  // left, west
	]);
	let ewMesh = new THREE.Mesh(ewGeom, ewMaterials);
	ewMesh.data = blockData;

	let nsGeom = new THREE.PlaneGeometry(1, 1);
	nsGeom.rotateY(1.5708);
	nsGeom.translate(pos[0], pos[1], pos[2]);
	let nsMaterials = new THREE.MultiMaterial([
		material, // back, south
		material  // front, north
	]);
	let nsMesh = new THREE.Mesh(nsGeom, nsMaterials);
	nsMesh.data = blockData;

	return [ewMesh, nsMesh];
}


function addWaterBlock(blockData) {
	let pos = blockData.position;

	return Textures.loadTextureAsync('textures/blocks/water_still.png').then(function (waterTexture) {
		let waterMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			map: waterTexture,
			opacity: 0.8,
			transparent: true
		});
		let geometry = new THREE.BoxGeometry(1, 1, 1);
		geometry.translate(pos[0], pos[1], pos[2]);
		let cube = new THREE.Mesh(geometry, waterMaterial);
		scene.add(cube);
		cube.data = blockData;
	});
}


function generateCubesAsync() {
	var dist = 10;

	return new Promise(function(resolve, reject){
		var x=0, y=0, z = 0;

		for (x=-15; x<=-5; x++) {
			for (z=-15; z<=-5; z++) {
				requestBlocks(x, z);
			}
		}
		positionCamera([10, 72, 10], [0, 62, 0]);

		// For testing a single block
		// requestBlocks(-7, -11);
		// positionCamera([10, 72, 10], [-7, 62, -11]);

		resolve();
	});
}


let cameraControls = new OrbitControls(camera, renderer.domElement, scene);
cameraControls.userPanSpeed = 1.0;
cameraControls.onObjectSelected = onObjectSelected;

function updateCameraPosition() {
	let delta = clock.getDelta(); // seconds.
	let moveDistance = 200 * delta; // 200 pixels per second
	let rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second

	cameraControls.update();
}

function onObjectSelected(intersected) {
	debugger;
	console.log(intersected.object);
}


var cameraAngle = 0;

function positionCamera(cameraPos, targetPos) {
	cameraControls.cameraObject.position.x = cameraPos[0];
	cameraControls.cameraObject.position.y = cameraPos[1];
	cameraControls.cameraObject.position.z = cameraPos[2];
	cameraControls.center = new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]);
	cameraControls.update();
	addAxisLines(targetPos);
}

generateCubesAsync().then(function () {
	render();
});

let render = function () {
	requestAnimationFrame(render);

	updateCameraPosition();
	renderer.render(scene, camera);
};