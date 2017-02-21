import $ from "jquery";
import io from "socket.io";
import * as THREE from "three";

import { OrbitControls } from "OrbitControls";

import LayeredTexture from "LayeredTexture";

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

var textureLoader = new THREE.TextureLoader();

var mapData = new Array(new Array(new Array()));


var socket = io('http://localhost:3000');
socket.on('connect', function(){});
socket.on('blockData', function(data){
	addBlockData(data);
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
function loadblockStates(block) {
	var blockStateKey = block.type;
	var stateName = block.displayName.toLowerCase().replace(/\s/, '_');

	var path = '/blockstates/' + stateName + '.json';
	if (!blockStateCache[blockStateKey]) {
		blockStateCache[blockStateKey] = $.getJSON(path).catch(function(){
			var otherPath = '/blockstates/' + block.name + '.json';
			return $.getJSON(otherPath)
		});
	}

	return blockStateCache[blockStateKey];
}

function getBlockVariant(block, variantdata) {
	if (variantdata.normal) {
		return isArray(variantdata.normal) ? variantdata.normal[0].model : variantdata.normal.model;
	}
	if (block.name === 'grass' && variantdata['snowy=false']) {
		return variantdata['snowy=false'][0].model;
	}

	console.log('TODO: Handle new variant: ', block, variantdata);
	throw 'Unsupported variant: ' + block.name
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
				var combinedModelData = $.extend({}, parentModel, modelData);
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
			var face = element.faces[faceName]
			var textureName = face.texture.replace(/^#/, '');
			face.texturePath = modelData.textures[textureName]
			faces[faceName].push(face);

		});
	});

	return faces;
}

function getTexturesForBlock(faceData) {
	var textures = {};

	Object.keys(faceData).forEach(function(faceName) {
		faceData[faceName].forEach(function(faceObj){
			textures[faceObj.texturePath] = true;
		});
	});

	return Object.keys(textures);
}

function loadTextureAsync(filePath) {
	return new Promise(function(resolve, reject) {
		textureLoader.load(filePath, function(texture){
			resolve(texture)
		})
	})
}

function loadTextureListAsync(commonPath, fileNames) {
	var requests = [];
	var oldPath = textureLoader.path;

	if (!fileNames) {
		fileNames = commonPath;
		commonPath = null;
	}
	if (commonPath) {
		textureLoader.setPath(commonPath);
	}

	fileNames.forEach(function(fileName){
		requests.push(loadTextureAsync(fileName + '.png'));
	});

	function resetPath(textures){
		textureLoader.setPath(oldPath);
	}

	var allLoadedPromise = Promise.all(requests).then(function(textureList){
		var textureMap = {}

		fileNames.forEach(function(fileName, index){
			textureMap[fileName] = textureList[index];
		});

		resetPath();
		return textureMap;
	});
	allLoadedPromise.then(resetPath, );
	return allLoadedPromise;

}

var tintedTextures = {};
function generateTintedTexture(textureName, texture, biomeColour) {
	var textureKey = textureName + '_' + biomeColour;

	if (! tintedTextures.hasOwnProperty(textureKey)) {
		tintedTextures[textureKey] = applyColorTransform(texture, biomeColour);
	}
	return tintedTextures[textureKey];
}

function generateBlockMaterials(faceData, textureMap, biomeData) {

	function renderFace(face) {
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
					texture = generateTintedTexture(faceLayer.texturePath, textureMap[faceLayer.texturePath], biomeData.color);
				}
				else {
					texture = textureMap[faceLayer.texturePath];
				}
				faceLayerList.push(texture);
			});
			return {color: 0xffffff, map: new LayeredTexture(faceLayerList), alphaTest: 0, side: THREE.DoubleSide};
		}
	}

	var materials = [
	// if the block.element.face has a "tintindex": 0 then use the biome colour instead of white
	    new THREE.MeshBasicMaterial( renderFace(faceData.east) ), // right, east
	    new THREE.MeshBasicMaterial( renderFace(faceData.west) ), // left, west
	    new THREE.MeshBasicMaterial( renderFace(faceData.up) ), // top
	    new THREE.MeshBasicMaterial( renderFace(faceData.down) ), // bottom
	    new THREE.MeshBasicMaterial( renderFace(faceData.south) ), // back, south
	    new THREE.MeshBasicMaterial( renderFace(faceData.north) )  // front, north
	];

	return new THREE.MultiMaterial( materials);
}


function applyColorTransform(texture, biomeColour) {
	var color = new THREE.Color(biomeColour);
	var canvasEl, ctx, 
		newCanvas, newContext;

	if (!texture.image) { return; }

	if (typeof texture.image.getContext === 'function') {
		canvasEl = texture.image;
		ctx = canvasEl.getContext('2d');
		newCanvas = document.createElement('canvas');
		newCanvas.width = canvasEl.width;
		newCanvas.height = canvasEl.height;
		newContext = newCanvas.getContext('2d');
	}
	else {
		newCanvas = document.createElement('canvas');
		newCanvas.width = texture.image.width;
		newCanvas.height = texture.image.height;
		ctx = newCanvas.getContext('2d');
		ctx.drawImage(texture.image, 0, 0);
		newContext = ctx;
	}

	var i,
		img = ctx.getImageData(0, 0, 16, 16), // Pull a rectangle of image data from context
		data = img.data, 
		len = data.length,
		newImage = newContext.getImageData(0,0,16,16),
		newData = newImage.data;

	// Loop through image data array.
	// Apply color trasform to each block of RGBA values.
	// Applied as: c = c * cmodifier + coffset.
	for (i = 0; i < len; i += 4) {
		newData[i] = data[i] * color.r;
		newData[i+1] = data[i + 1] * color.g;
		newData[i+2] = data[i + 2] * color.b;
		newData[i+3] = data[i + 3]
	}

	newContext.putImageData(newImage, 0, 0);

	return new THREE.CanvasTexture(newCanvas);
}

function addBlockData(blockData) {
	var block = blockData.block;
	var biome = block.biome;
	var pos = blockData.position;
	var blockModel,
		blockFaces,
		blockTextures;

	loadblockStates(block).then(function(stateData) {
		if (stateData.variants) {
			var modelName = getBlockVariant(block, stateData.variants);
			return loadModelData('block/' + modelName);
		}
		else {
			console.error('UNSUPPORTED: variant data missing.', stateData)
		}
	}, function(blockStateError){
		console.error('Cant find state for block', blockData);
	}).then(function(modelDataResponse){
		blockModel = modelDataResponse;
		blockFaces = getFaceData(modelDataResponse);
		var texturePathsList = getTexturesForBlock(blockFaces);
		return loadTextureListAsync('textures/', texturePathsList);
	}).then(function(textureList){
		console.log(blockData, blockModel, blockFaces, textureList);
		blockTextures = textureList;

		var geometry = new THREE.BoxGeometry( 1,1,1 );
		geometry.translate(pos[0], pos[1], pos[2] );
		var materials = generateBlockMaterials(blockFaces, textureList, biome);
		var cube = new THREE.Mesh(geometry, materials);

		scene.add(cube);
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

		// requestBlocks(-7, -11);
		// positionCamera([10, 72, 10], [-7, 62, -11]);
		resolve();
	});
}


var cameraControls = new OrbitControls( camera, renderer.domElement );
cameraControls.userPanSpeed = 1.0

function updateCameraPosition()
{
	var delta = clock.getDelta(); // seconds.
	var moveDistance = 200 * delta; // 200 pixels per second
	var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second
	
	cameraControls.update();
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