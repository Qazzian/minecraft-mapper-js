import $ from "jquery";
import io from "socket.io";
import * as THREE from "three";

import { OrbitControls } from "OrbitControls";

import { Textures } from "Textures";
import LayeredTexture from "LayeredTexture";
import { BlockStateMap } from "BlockStateMap";



"use strict"; 
		// X is left - right, west - east
		// Y is up - down
		// Z is forward and back, north & south
		

console.log('THREE.REVISION: ', THREE.REVISION);
THREE.Cache.enabled = true;


var clock = new THREE.Clock();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.5, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var socket = io('http://localhost:3000');
socket.on('connect', function(){});
socket.on('blockData', function(data){
	addBlockData(data);
});
socket.on('blockList', function(data){
	addBlockList(data);
});
socket.on('disconnect', function(){});

function requestBlocks(x, z) {
	socket.emit('blockRequest', {x: x, z:z}, function(blockData){
		// console.log('blockRequest: ', blockData);
	});
}


function isArray(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
}

function addAxisLines(pos) {
	var axisHelper = new THREE.AxisHelper( 10 );
	axisHelper.translateX(pos[0]);
	axisHelper.translateY(pos[1]);
	axisHelper.translateZ(pos[2]);
	scene.add( axisHelper );
}

var blockStateCache = {};
function loadblockStates(stateName) {
	var blockStateKey = stateName;

	var path = '/blockstates/' + stateName + '.json';
	if (!blockStateCache[blockStateKey]) {
		blockStateCache[blockStateKey] = $.getJSON(path).catch(function(){
			var otherPath = '/blockstates/' + block.name + '.json';
			return $.getJSON(otherPath)
		});
	}

	return blockStateCache[blockStateKey];
}

var modelDataCache = {};

function loadModelData(modelName) {
	// TODO change this to cache the promise function, ATM we are making multiple requests to the same file.

	if (modelDataCache.hasOwnProperty(modelName)) {
		return modelDataCache[modelName];
	}

	var request = $.getJSON('/models/' + modelName + '.json').then(function(modelData) {
		if (modelData.parent) {
			return loadModelData(modelData.parent).then(function(parentModel){
				var combinedModelData = $.extend(true, {}, parentModel, modelData);
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

	var faces = {};

	modelData.elements.forEach(function(element){
		Object.keys(element.faces).forEach(function(faceName){
			if (!faces.hasOwnProperty(faceName)) {
				faces[faceName] = [];
			}
			var face = element.faces[faceName];
			var textureName = face.texture.replace(/^#/, '');
			face.texturePath = modelData.textures[textureName] || modelData.textures['all'];
			while (face.texturePath.match(/^#/)) {
				face.texturePath = modelData.textures[face.texturePath.replace(/^#/, '')];
			}
			faces[faceName].push(face);

		});
	});

	return faces;
}


function renderFace(face, textureMap, biomeData) {
	var baseColor;

	if (face.length === 1) {
		baseColor = face[0].hasOwnProperty('tintindex') ? biomeData.color : 0xffffff;
		return {color: baseColor, map: textureMap[face[0].texturePath], alphaTest: 0.5, side: THREE.DoubleSide}
	}
	else if (face.length > 1) {
		var faceLayerList = [];
		face.forEach(function(faceLayer){
			var texture;
			if (faceLayer.hasOwnProperty('tintindex')) {
				texture = Textures.generateTintedTexture(faceLayer.texturePath, textureMap[faceLayer.texturePath], biomeData.color);
			}
			else {
				texture = textureMap[faceLayer.texturePath];
			}
			faceLayerList.push(texture);
		});
		return {color: 0xffffff, map: new LayeredTexture(faceLayerList), alphaTest: 0, side: THREE.DoubleSide};
	}
}

function generateBlockMaterials(faceData, textureMap, biomeData) {



	var materials = [
	// if the block.element.face has a "tintindex": 0 then use the biome colour instead of white
	    new THREE.MeshBasicMaterial( renderFace(faceData.east, textureMap, biomeData) ), // right, east
	    new THREE.MeshBasicMaterial( renderFace(faceData.west, textureMap, biomeData) ), // left, west
	    new THREE.MeshBasicMaterial( renderFace(faceData.up, textureMap, biomeData) ), // top
	    new THREE.MeshBasicMaterial( renderFace(faceData.down, textureMap, biomeData) ), // bottom
	    new THREE.MeshBasicMaterial( renderFace(faceData.south, textureMap, biomeData) ), // back, south
	    new THREE.MeshBasicMaterial( renderFace(faceData.north, textureMap, biomeData) )  // front, north
	];

	return new THREE.MultiMaterial( materials);
}

function addBlockList(blocks) {
	// console.log('BLOCK LIST:', blocks);
	blocks.forEach(function(blockData){
		if (blockData.block.type !== 0) {
			setTimeout(function(){
				addBlockData(blockData);
			}, 0);
		}
	});
}

function addBlockData(blockData) {
	var block = blockData.block;
	var biome = block.biome;
	var pos = blockData.position;
	var stateName,
		variantIndex,
		blockModel,
		blockFaces,
		blockTextures;


	if (block.type === 8 || block.type === 9) {
		return addWaterBlock(blockData);
	}
	else if (typeof BlockStateMap[block.type] === 'function') {
		var stateData = BlockStateMap[block.type](block);
	}
	else {
		stateData = BlockStateMap.byDisplayName(block);
	}

	stateName = stateData.stateName;
	variantIndex = stateData.variantName;

	loadblockStates(stateName).then(function(stateData) {
		if (stateData.variants && stateData.variants[variantIndex]) {
			var variant = stateData.variants[variantIndex];
			if (isArray(variant)) {
				variant = variant[0];
			}
			return loadModelData('block/' + variant.model);
		}
		else {
			console.error('UNSUPPORTED: variant data missing.', stateData)
		}
	}, function(blockStateError){
		console.error('Cant find state for block', block.name, blockData);
	}).then(function(modelDataResponse){
		blockModel = modelDataResponse;
		blockFaces = getFaceData(modelDataResponse);
		var texturePathsList = Textures.getTexturesForBlock(blockFaces);
		return Textures.loadTextureListAsync('textures/', texturePathsList);
	}).then(function(textureList){
		// console.log(blockData.block.name, blockData, blockModel, blockFaces, textureList);
		blockTextures = textureList;
		if (blockFaces.up && blockFaces.down) {
			var renderedBlock = buildStandardBlock(blockData, blockModel, blockFaces, textureList, biome);
			scene.add(renderedBlock);
		}
		else {
			// It's probably a cross shape
			var [ewMesh, nsMesh] = buildCrossBlock(blockData, blockFaces, textureList, biome);
			scene.add(ewMesh, nsMesh);
		}

	});
}

function buildStandardBlock(blockData, blockModel, blockFaces, textureList, biome) {

	const pos = blockData.position;
	const elementData = blockModel.elements[0];
	var geometrySizes = {
		x: (elementData.to[0] - elementData.from[0]) / 16,
		y: (elementData.to[1] - elementData.from[1]) / 16,
		z: (elementData.to[2] - elementData.from[2]) / 16
	};
	var heightCorrection = (1 - geometrySizes.y) / 2;

	var geometry = new THREE.BoxGeometry( geometrySizes.x, geometrySizes.y, geometrySizes.z );
	geometry.translate(pos[0], pos[1] - heightCorrection, pos[2] );
	var materials = generateBlockMaterials(blockFaces, textureList, biome);
	var renderedBlock = new THREE.Mesh(geometry, materials);
	renderedBlock.data = blockData;

	return renderedBlock;
}

function buildCrossBlock(blockData, blockFaces, textureList, biome) {
	const pos = blockData.position;
	var ewGeom = new THREE.PlaneGeometry(1, 1);

	ewGeom.translate(pos[0], pos[1], pos[2] );
	var ewMaterials = new THREE.MultiMaterial([
		new THREE.MeshBasicMaterial( renderFace(blockFaces.east, textureList, biome) ), // right, east
		new THREE.MeshBasicMaterial( renderFace(blockFaces.west, textureList, biome) )  // left, west
	]);
	var ewMesh = new THREE.Mesh(ewGeom, ewMaterials);
	ewMesh.data = blockData;

	var nsGeom = new THREE.PlaneGeometry(1, 1);
	nsGeom.rotateY(1.5708);
	nsGeom.translate(pos[0], pos[1], pos[2] );
	var nsMaterials = new THREE.MultiMaterial([
		new THREE.MeshBasicMaterial( renderFace(blockFaces.south, textureList, biome) ), // back, south
		new THREE.MeshBasicMaterial( renderFace(blockFaces.north, textureList, biome) )  // front, north
	]);
	var nsMesh = new THREE.Mesh(nsGeom, nsMaterials);
	nsMesh.data = blockData;

	return [ewMesh, nsMesh];

}


function addWaterBlock(blockData) {
	var pos = blockData.position;

	return Textures.loadTextureAsync('textures/blocks/water_still.png').then(function(waterTexture){
		var waterMaterial = new THREE.MeshBasicMaterial( {
			color: 0xffffff, 
			map: waterTexture,
			opacity: 0.8,
			transparent: true
		} );
		var geometry = new THREE.BoxGeometry( 1,1,1 );
		geometry.translate(pos[0], pos[1], pos[2] );
		var cube = new THREE.Mesh(geometry, waterMaterial);
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


var cameraControls = new OrbitControls( camera, renderer.domElement, scene );
cameraControls.userPanSpeed = 1.0;
cameraControls.onObjectSelected = onObjectSelected;

function updateCameraPosition()
{
	var delta = clock.getDelta(); // seconds.
	var moveDistance = 200 * delta; // 200 pixels per second
	var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second
	
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
	cameraControls.center = new THREE.Vector3( targetPos[0], targetPos[1], targetPos[2] );
	cameraControls.update();
	addAxisLines(targetPos);
}

generateCubesAsync().then(function(){
		render();
});

var render = function () {
	requestAnimationFrame( render );

	updateCameraPosition();
	renderer.render(scene, camera);
};