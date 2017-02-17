import * as THREE from "three";

function isArray(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
}

/**
 * @constructor
 * Overlays the given textures onto a canvas element which is then used to generate a new Texture.
 * The first parameter should be an array of Textures. The rest of the arguments are the same as Texture.
 * Textures will be overlayed in order. The first texture in the array will be the background, 
 * then next will overlay the background, and so on.
 * The image from the first Texture is used to set the size of the final image.
 */
function LayeredTexture(textureList) {

	var generatedImage = document.createElement('canvas');
	var t1 = textureList[0];
	generatedImage.width = t1.image.width;
	generatedImage.height = t1.image.height;
	var context = generatedImage.getContext('2d');

	if (!isArray(textureList)) {
		throw Error("Expecting an array of Textures.", textureList);
	}

	textureList.forEach(function(texture) {
		if (texture.image) {
			context.drawImage(texture.image, 0, 0);
		}
	});

	THREE.CanvasTexture.call(this, generatedImage);

	// THREE.Texture.call( this, generatedImage, t1.mapping, t1.wrapS, t1.wrapT, t1.magFilter, t1.minFilter, t1.format, t1.type, t1.anisotropy);
}

LayeredTexture.prototype = Object.create( THREE.CanvasTexture.prototype );
LayeredTexture.prototype.constructor = LayeredTexture;



export { LayeredTexture as default };