import * as THREE from "three";
import LayeredTexture from "LayeredTexture";

var textureLoader = new THREE.TextureLoader();

var tintedTextures = {};

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
		return new Promise(function(resolve, reject) {
			textureLoader.load(filePath, function(texture){
				resolve(texture)
			});
		});
	},

	loadTextureListAsync: function(commonPath, fileNames) {
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
			requests.push(Textures.loadTextureAsync(fileName + '.png'));
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

		allLoadedPromise.then(resetPath);

		return allLoadedPromise;
	},
}

export { Textures };



