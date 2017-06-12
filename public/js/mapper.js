

import * as THREE from "three";


import { SceneRenderer } from "SceneRenderer";
import { BlockRenderer } from "BlockRenderer";
import { QazzianMapServer } from "mapInterfaces/QazzianMapServer";

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
		// The co-ords to start looking at
		this.origin = [10, 100, 360];
		// How far to render the map from the origin
		this.dist = 10;
		this.camOffset = [10, 10, 10];

		this.mapInterface = new QazzianMapServer({
			onBlockReceived: (blockData) => {this.addBlockData(blockData);}
		});
		this.sceneRenderer = new SceneRenderer();
		this.scene = this.sceneRenderer.scene;

		this.blockRenderer = new BlockRenderer();

		this.meshByMaterial = {};
		this.meshByChunk = {};

		// if (debugMode) {
			this.addDebugObjects(this.origin);
			this.lookAt(this.origin);
		// }
	}

	start() {
		this.requestMapData();
		this.lookAt(this.origin);
		this.sceneRenderer.animate();
	}

	addDebugObjects(pos) {
		this.sceneRenderer.addAxisLines(pos);
	}

	lookAt(position, offset = this.camOffset) {

		this.sceneRenderer.positionCamera([position[0] + offset[0], position[1] + offset[1], position[2] + offset[2]],
			[position[0], position[1], position[2]]);
	}

	positionCamera(cameraPos, targetPos) {
		console.info('pos cam', cameraPos, targetPos);
		this.sceneRenderer.positionCamera(cameraPos, targetPos);
	}

	requestMapData() {
		let dist = this.dist;
		let origin = this.origin;

		let x = this.origin[0] || 0,
			z = this.origin[2] || 0;

		this.mapInterface.requestArea(x-dist, x+dist, z-dist, z+dist);
	}

// TODO use a webWorker to process the block data queue and add elements to the scene
	addBlockData(blockData) {
		console.info('addBlockData: ', blockData);
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
			console.info('Add Mesh to scene: ', mesh);
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
			// The merge here is going to be more complicated as the materials won't all match up.
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

const mapper = window.mapper = new Mapper();

function onObjectSelected(intersected) {
	console.log(intersected.object.data);
}

mapper.start();