import * as THREE from "three";
import LayeredTexture from "LayeredTexture";

'use strict';

var textureLoader = new THREE.TextureLoader();
var textureFileCache = {};

var tintedTextures = {};
var colormaps = {
	grass: null,
	foliage: null
};

function imgToCanvas(image) {
	let canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;
	canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
	return canvas;
}

textureLoader.load('textures/colormap/grass.png', texture => {
	colormaps.grass = imgToCanvas(texture.image);

});
textureLoader.load('textures/colormap/foliage.png', texture => {
	colormaps.foliage = imgToCanvas(texture.image);
});

function clamp(num) {
	num = Math.max(num, 0.0);
	num = Math.min(num, 1.0);
	return num;
}

var Textures = {
	applyColorTransform: function(texture, biomeColour) {
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
	},

	getTintColour: function (block) {
		// TODO this is only for standard biomes. Swampland, Roofed forest and Mesa have special rules
		let mapName = block.type === 2 ? 'grass' : 'foliage';
		let temp = clamp(block.biome.temperature);
		let rain = clamp(block.biome.rainfall) * temp;

		// temp 1 -> 0
		// rain 0 \|/ 1

		let offsetX = colormaps[mapName].width - (colormaps[mapName].width * temp);
		offsetX = Math.round(offsetX);
		let offsetY = colormaps[mapName].height - (colormaps[mapName].height * rain);
		offsetY = Math.round(offsetY);

		var pixelData = colormaps[mapName].getContext('2d').getImageData(offsetX, offsetY, 1, 1).data;

		let hexValue = pixelData[0]*255*255 + pixelData[1]*255 + pixelData[2];
		return hexValue;
	},

	generateTintedTexture: function(textureName, texture, biomeColour) {
		var textureKey = textureName + '_' + biomeColour;

		if (! tintedTextures.hasOwnProperty(textureKey)) {
			tintedTextures[textureKey] = Textures.applyColorTransform(texture, biomeColour);
		}
		return tintedTextures[textureKey];
	},

	getTexturesForBlock: function(faceData) {
		var textures = {};

		Object.keys(faceData).forEach(function(faceName) {
			faceData[faceName].forEach(function(faceObj){
				textures[faceObj.texturePath] = true;
			});
		});

		return Object.keys(textures);
	},

	loadTextureAsync: function(filePath) {
		if (!filePath || filePath.match(/(undefined|#all)/)) {
			debugger;
		}
		if (!textureFileCache[filePath]) {
			textureFileCache[filePath] = new Promise(function(resolve, reject) {
				textureLoader.load(filePath, function(texture){
					resolve(texture)
				});
			});
		}
		return textureFileCache[filePath];
	},

	loadTextureListAsync: function(commonPath, fileNames) {
		var requests = [];

		if (!fileNames) {
			fileNames = commonPath;
			commonPath = '';
		}

		fileNames.forEach(function(fileName){
			requests.push(Textures.loadTextureAsync(commonPath + fileName + '.png'));
		});


		var allLoadedPromise = Promise.all(requests).then(function(textureList){
			var textureMap = {};

			fileNames.forEach(function(fileName, index){
				textureMap[fileName] = textureList[index];
			});

			return textureMap;
		});

		return allLoadedPromise;
	}
};

export { Textures };



