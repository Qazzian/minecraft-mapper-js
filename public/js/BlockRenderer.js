import * as THREE from "three";

import { Textures } from "./Textures";
import LayeredTexture from "./LayeredTexture";
import { BlockState } from "./blockState";

class BlockRenderer {
	constructor(block) {

	}

	render (blockData) {
		console.info('Rendering block:', blockData);

		const self = this;
		let block = blockData.mcData;
		let biome = block.biome;
		let blockModel,
			blockFaces,
			blockTextures;

		if (block.type === 8 || block.type === 9) {
			return buildWaterBlock(blockData);
		}

		return BlockState.loadBlockStates(block).then(function (variant) {
			return loadModelData('block/' + variant.model);
		}).catch(function (blockError) {
			console.error('Error loading block: ', block.name, blockData, blockError);
		}).then(function (modelDataResponse) {
			blockModel = modelDataResponse;
			blockFaces = getFaceData(modelDataResponse);
			let texturePathsList = Textures.getTexturesForBlock(blockFaces);
			return Textures.loadTextureListAsync('textures/', texturePathsList);
		}).then(function (textureList) {
			// TODO merge geometries see http://learningthreejs.com/blog/2011/10/05/performance-merging-geometry/
			blockTextures = textureList;
			if (blockFaces.up && blockFaces.down) {
				return buildStandardBlock(blockData, blockModel, blockFaces, textureList, biome);
			}
			else {
				// It's probably a cross shape
				return buildCrossBlock(blockData, blockFaces, textureList);
			}

		});
	}
}

export { BlockRenderer }

let modelDataCache = {};

async function loadModelData(modelName) {
	if (modelDataCache.hasOwnProperty(modelName)) {
		return modelDataCache[modelName];
	}

	const request = await fetch('/models/' + modelName + '.json');
	const modelData = await request.json();
	if (modelData.parent) {
		const parentModel = await loadModelData(modelData.parent);
		modelDataCache[modelName] = {...parentModel, ...modelData};
		return modelDataCache[modelName];
	}
	else {
		modelDataCache[modelName] = modelData;
		return modelData;
	}
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

let materialCache = {};
function generateBlockMaterials(faceData, textureMap, block) {
	let materialKey = [block.name, block.metadata, block.biome.name].join('|');

	if (!materialCache[materialKey]) {
		var materials = [
			renderFace(faceData.east, textureMap, block), // right, east
			renderFace(faceData.west, textureMap, block), // left, west
			renderFace(faceData.up, textureMap, block), // top
			renderFace(faceData.down, textureMap, block), // bottom
			renderFace(faceData.south, textureMap, block), // back, south
			renderFace(faceData.north, textureMap, block)  // front, north
		];
		materialCache[materialKey] = new THREE.MultiMaterial(materials);
		materialCache[materialKey].key = materialKey;
	}

	return materialCache[materialKey];
}

let waterCache = {};
function generateWaterBlockMaterial(blockData) {
	let biomeType = blockData.biome.id;

	if (!waterCache[biomeType]) {
		waterCache[biomeType] = Textures.loadTextureAsync('textures/blocks/water_still.png').then(function (waterTexture) {

			return new THREE.MeshBasicMaterial({
				color: 0xffffff,
				map: waterTexture,
				opacity: 0.8,
				transparent: true
			});
		});
	}

	return waterCache[biomeType];
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

	let geometry = new THREE.BoxGeometry(geometrySizes.x, geometrySizes.y, geometrySizes.z);
	geometry.translate(pos.x, pos.y - heightCorrection, pos.z);
	let materials = generateBlockMaterials(blockFaces, textureList, blockData.block);

	return {
		geometry: geometry,
		material: materials
	};
}

function buildCrossBlock(blockData, blockFaces, textureList) {
	let material = renderFace(blockFaces.east, textureList, blockData.block);
	const pos = blockData.position;
	let nsGeom = new THREE.PlaneGeometry(1, 1);
	let ewGeom = new THREE.PlaneGeometry(1, 1);
	nsGeom.rotateY(1.5708);

	nsGeom.merge(ewGeom);
	nsGeom.translate(pos.x, pos.y, pos.z);
	return {
		geometry: nsGeom,
		material: material
	};
}

function buildWaterBlock(blockData) {
	let pos = blockData.position;

	return generateWaterBlockMaterial(blockData.block).then(waterMaterial => {
		let geometry = new THREE.BoxGeometry(1, 1, 1);
		geometry.translate(pos.x, pos.y, pos.z);
		return {
			geometry: geometry,
			material: waterMaterial
		};
	});
}
