import * as THREE from "three";
import io from 'socket.io-client';

import { SceneRenderer } from "./SceneRenderer";
import BlockDataCache from "./BlockDataCache";
import { BlockRenderer } from "./BlockRenderer";
import { QazzianMapServer } from "./mapInterfaces/QazzianMapServer";
import chunk from "../../common/chunk";

"use strict";

// Note about Axis in Three.js
// X is left - right, west - east
// Y is up - down
// Z is forward and back, north & south
// Which matches Minecraft :)

// Sea level: Y=64

console.log('THREE.REVISION: ', THREE.REVISION);
THREE.Cache.enabled = true;

const debugMode = true;

class Mapper {
	constructor() {
		// The co-ords to start looking at
		// this.origin = [10, 100, 360];
		this.origin = [0, 60, 0];
		// How far to render the map from the origin
		this.dist = 1;
		this.camOffset = [-10, 10, 10];

		this.mapInterface = new QazzianMapServer(io, {
			onBlockReceived: (blockData) => {this.addBlockData(blockData); },
			onChunkReceived: (chunkData) => {this.processChunk(chunkData); }
		});
		this.sceneRenderer = new SceneRenderer();
		this.scene = this.sceneRenderer.scene;

		this.blockDataCache = new BlockDataCache();

		this.blockRenderer = new BlockRenderer();

		this.meshByMaterial = {};
		this.meshByChunk = {};

		// if (debugMode) {
			this.addDebugObjects(this.origin);
			this.lookAt(this.origin);
		// }

		document.querySelector('.play').addEventListener('click', () => {this.onPlay()});
		document.querySelector('.pause').addEventListener('click', () => {this.onPause()});
		document.querySelector('.step').addEventListener('click', () => {this.onStep()});
	}

	start() {
		this.requestMapData();
		this.lookAt(this.origin);
		this.sceneRenderer.render();
	}

	onPlay() {
		this.sceneRenderer.play();
	}

	onPause() {
		this.sceneRenderer.pause();
	}

	onStep() {
		this.sceneRenderer.render();
	}

	addDebugObjects(pos) {
		window.scene = this.scene;
		window.THREE = THREE;
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

	async requestMapData() {
		let dist = this.dist;

		let x = this.origin[0] || 0,
			z = this.origin[2] || 0;

		// this.mapInterface.requestArea(x-dist, x+dist, z-dist, z+dist);
		const chunk1 = await this.mapInterface.requestChunk(x, z);
		this.processChunk(chunk1);
	}

	addBlockData(blockData) {
		console.info('addBlockData: ', blockData);
		this.blockRenderer.render(blockData).then(modelData => {
			modelData.block = blockData.block;
			modelData.position = blockData.position;
			this.addToScene(modelData);
		});
	}

	async processChunk(chunkNbt) {
		console.info('Chunk data: ', chunkNbt);

		const chunkPos = chunk.getPosition(chunkNbt);
		const sections = chunk.getSectionList(chunkNbt);
		if (!sections.length) {
			return;
		}

		const sectionIndex = sections.length - 1;
		const topSection = sections[sectionIndex];
		console.info('Top Section: ', topSection);
		const sectionYPos = chunk.getSectionYPos(topSection);
		const blockIter = chunk.iterSectionBlocks(topSection);
		let next = blockIter.next();
		while(!next.done) {

			const block = next.value;
			block.chunkPos = chunk.sectionCoordsToChunkCoords(block.sectionPos, sectionIndex);
			block.pos = chunk.getWorldPosForBlock(block.chunkPos, chunkPos);
			block.mcData = await this.blockDataCache.get(block.name, (blockName) => {return this.mapInterface.requestBlockData(blockName)});
			debugger;
			// TODO need to get getMcVersion and fill the block with relevant render data
			// TODO make the data request over socket
			this.addBlockData(block);
			next = blockIter.next();
		}

		console.info('First block in section:', nextBlock);
		debugger;


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
