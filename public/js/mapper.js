import $ from "jquery";
import io from "socket.io";
import * as THREE from "three";


"use strict"; 
		// X is left - right
		// Y is up - down
		// Z is depth
		



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

function addAxisLine(color, lastPos) {
	var x_material = new THREE.LineBasicMaterial({ color: color });
	var x_geometry = new THREE.Geometry();
	x_geometry.vertices.push(new THREE.Vector3(0, 0, 0));
	x_geometry.vertices.push(lastPos);
	var line = new THREE.Line(x_geometry, x_material);
	scene.add(line);
}

function addAxisLines() {
	addAxisLine(0xff0000, new THREE.Vector3(10, 0, 0));
	addAxisLine(0x00ff00, new THREE.Vector3(0, 10, 0));
	addAxisLine(0x0000ff, new THREE.Vector3(0, 0, 10));
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

function getBlockVariant(block, variantdata) {
	if (block.name === 'grass' && variantdata['snowy=false']) {
		return variantdata['snowy=false'][0].model;
	}
	else {
		console.log('TODO: Handle new variant: ', block, variantdata);
		throw 'Unsupported variant: ' + block.name
	}
}

function loadModelData(modelName) {
	return new Promise(function(resolve, reject) {
		console.log('get model data for ', modelName);

		// TODO cache the result

		$.getJSON('/models/' + modelName + '.json').then(function(modelData) {
			if (modelData.parent) {
				loadModelData(modelData.parent).then(function(parentModel){
					modelData.parentModel = parentModel
					resolve(modelData)
				});
			}
			else {
				resolve(modelData);
			}
		});
	});
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

function generateCubesAsync() {
	return new Promise(function(resolve, reject){
		loadTextureAsync('textures/blocks/coarse_dirt.png').then(function(texture){
			var x, y=0, z = 0;

			for (x=-5; x<5; x++) {
				for (z=-3; z<3; z++) {
					var geometry = new THREE.BoxGeometry( 1,1,1 );
					geometry.translate(x*1.5, y, z*1.5);
					var material = new THREE.MeshBasicMaterial( {
						map: texture
					 });

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
	// requestAnimationFrame( render );
	cameraAngle += 0.05;
	camera.position.x = Math.cos(cameraAngle)*10;
	camera.position.z = Math.sin(cameraAngle)*10;
	
	camera.lookAt(new THREE.Vector3( 0, 0, 0 ))

	renderer.render(scene, camera);
};