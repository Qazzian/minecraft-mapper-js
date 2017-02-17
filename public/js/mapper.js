import $ from "jquery";
import io from "socket.io";
import * as THREE from "three";

import LayeredTexture from "LayeredTexture";

"use strict"; 
		// X is left - right
		// Y is up - down
		// Z is depth
		

console.log('THREE.REVISION: ', THREE.REVISION);
THREE.Cache.enabled = true;


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
	console.log('blockData:', data);
	addBlockData(data);
});
socket.on('disconnect', function(){});

socket.emit('blockRequest', {x: 0, z:0}, function(blockData){
	console.log('blockRequest: ', blockData);
})

function addAxisLines() {
	var axisHelper = new THREE.AxisHelper( 10 );
	scene.add( axisHelper );
}

function loadblockStates(blockName) {
	var path = '/blockstates/' + blockName + '.json';
	return $.getJSON(path);
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
		requests.push(loadTextureAsync(fileName));
	});

	function resetPath(textures){
		textureLoader.setPath(oldPath);
	}

	var allLoadedPromise = Promise.all(requests);
	allLoadedPromise.then(resetPath, resetPath);
	return allLoadedPromise;

}

function getBlockVariant(block, variantdata) {
	if (block.name === 'grass' && variantdata['snowy=false']) {
		return variantdata['snowy=false'][0].model;
	}
	else {
		console.log('TODO: Handle new variant: ', block, variantdata);
		throw 'Unsupported variant: ' + block.name
	}
}



var modelDataCache = {};

function loadModelData(modelName) {
	return new Promise(function(resolve, reject) {
		console.log('get model data for ', modelName);

		if (modelDataCache.hasOwnProperty(modelName)) {
			resolve(modelDataCache[modelName]);
			return;
		}

		$.getJSON('/models/' + modelName + '.json').then(function(modelData) {
			if (modelData.parent) {
				loadModelData(modelData.parent).then(function(parentModel){
					var combinedModelData = $.extend({}, parentModel, modelData);
					modelDataCache[modelName] = combinedModelData;
					resolve(combinedModelData)
				});
			}
			else {
				modelDataCache[modelName] = modelData;
				resolve(modelData);
			}
		});
	});
}

function parseModelData(modelData) {
	if (!modelData.textures || !modelData.elements) {
		console.error("missing modelData. Expecting textures and elements: ", modelData);
	}

	// TODO build MeshBasicMaterial from the texture data
}

function addBlockData(blockData) {
	var block = blockData.block;
	var pos = blockData.position;

	loadblockStates(block.name).then(function(stateData) {
		console.log('blockstates response: ', stateData);
		if (stateData.variants) {
			var modelName = getBlockVariant(block, stateData.variants);
			loadModelData('block/' + modelName).then(function(modelDataResponse){
				console.log('modelDataResponse: ', modelDataResponse);
			})
		}
	})


	// TODO get model data, use this to get texture data for the various sides
	// todo need to create the block and add it to the scene.
	// can also add it to model data but I think the scene should be enough.

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


function generateCubesAsync() {
	return new Promise(function(resolve, reject){
		loadTextureListAsync('textures/blocks/', ['coarse_dirt.png', 'grass_top.png', 'grass_side.png', 'grass_side_overlay.png']).then(function(textures) {
			var x=0, y=0, z = 0;

			// TODO make the overlay green

			var biomeSpecificGrassSideOverlayTexture = applyColorTransform(textures[3], 9286496)
			var grassSideTexture = new LayeredTexture([textures[2], biomeSpecificGrassSideOverlayTexture]);

			document.body.appendChild(grassSideTexture.image);

			for (x=-5; x<5; x++) {
				for (z=-3; z<3; z++) {
			var geometry = new THREE.BoxGeometry( 1,1,1 );
			geometry.translate(x, y, z);
			var materials = [
			// if the block.element.face has a "tintindex": 0 then use the biome colour instead of white
			    new THREE.MeshBasicMaterial( { color: 0xffffff, map: grassSideTexture } ), // right
			    new THREE.MeshBasicMaterial( { color: 0xffffff, map: textures[0] } ), // left
			    new THREE.MeshBasicMaterial( { color: 9286496, map: textures[1] } ), // top
			    new THREE.MeshBasicMaterial( { color: 0xffffff, map: textures[0] } ), // bottom
			    new THREE.MeshBasicMaterial( { color: 0xffffff, map: grassSideTexture } ), // back
			    new THREE.MeshBasicMaterial( { color: 0xffffff, map: textures[0] } )  // front
			    // new THREE.MeshBasicMaterial( { color: 0xff0000 } ), // right
			    // new THREE.MeshBasicMaterial( { color: 0x0000ff } ), // left
			    // new THREE.MeshBasicMaterial( { color: 0x00ff00 } ), // top
			    // new THREE.MeshBasicMaterial( { color: 0xffff00 } ), // bottom
			    // new THREE.MeshBasicMaterial( { color: 0x00ffff } ), // back
			    // new THREE.MeshBasicMaterial( { color: 0xff00ff } )  // front
			];

			var material = new THREE.MultiMaterial( materials);

			var cube = new THREE.Mesh(geometry, material);
			scene.add(cube);
			resolve();
				}
			}
		});
	});
}

addAxisLines();

var cameraAngle = 0;

generateCubesAsync().then(function(){
	camera.position.x = Math.cos(cameraAngle)*10;
	camera.position.z = Math.sin(cameraAngle)*10;
	camera.position.y = 5;
	camera.lookAt(new THREE.Vector3( 0, 0, 0 ))
	render()
});
var render = function () {
	requestAnimationFrame( render );
	cameraAngle += 0.05;
	camera.position.x = Math.cos(cameraAngle)*10;
	camera.position.z = Math.sin(cameraAngle)*10;
	
	camera.lookAt(new THREE.Vector3( 0, 0, 0 ))

	renderer.render(scene, camera);
};