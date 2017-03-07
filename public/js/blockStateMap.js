/**
 * Created by ian-wallis on 26/02/2017.
 */

class MetaFields {
	constructor (stateName, variantName) {
		this.stateName = stateName;
		this.variantName = variantName || 'normal';
	}
};

var BlockStateMap = {
	byName: function(block, variantName) {
		return new MetaFields(block.name, variantName);
	},
	byDisplayName: function(block, variantName) {
		return new MetaFields(block.displayName.toLowerCase().replace(/\s/, '_'), variantName);
	},
	// air
	0: function(){
		return new MetaFields('air');
	},
	// stone
	1: function(block) {
		var stoneTypes = [
			'stone',
			'granite',
			'smooth_granite',
			'diorite',
			'smooth_diorite',
			'andesite',
			'smooth_andesite'
		];
		return new MetaFields(stoneTypes[block.metadata]);
	},
	// grass
	2: function (block) {
		var varList = ['snowy=false', 'snowy=true'];
		return new MetaFields(block.name, varList[block.metadata]);
	},
	// log
	17: function(block) {
		var materialPart = block.metadata & 0b11;
		var directionPart = block.metadata & 0b1100;

		var materials = [ 'oak', 'spruce', 'birch', 'jungle'];
		var directions = ["axis=y", "axis=z", "axis=x", "axis=none"];

		return new MetaFields(
			materials[materialPart] + '_log',
			directions[directionPart >> 2]
		);
	},
	// leaves
	18: function (block) {
		var materialPart = block.metadata & 0b11;
		var materials = [ 'oak', 'spruce', 'birch', 'jungle'];
		return new MetaFields(materials[materialPart] + '_leaves');
	},
	// red_flower
	38: function (block) {
		var types = [
			'poppy',
			'blue_orchid',
			'allium',
			'houstonia',
			'red_tulip',
			'orange_tulip',
			'white_tulip',
			'pink_tulip',
			'oxeye_daisy'
		];

		return new MetaFields(types[block.metadata]);
	},
	// snow
	78: function (block) {
		var layers = ["layers=1","layers=2","layers=3","layers=4","layers=5","layers=6","layers=7","layers=8"];

		return BlockStateMap.byName(block, layers[block.metadata]);
	},
	// reeds
	83: function (block) {
		return BlockStateMap.byName(block);
	},
	// double_plant
	175: function (block) {
		var materialPart = block.metadata & 0b111;
		var isTop = !!(block.metadata & 0b1000);
		var types = [
			'sunflower',
			'syringa',
			'double_grass',
			'double_fern',
			'double_rose',
			'paeonia'
		];
		var section = isTop ? "half=upper" : "half=lower";
		return new MetaFields(types[materialPart], section);
	}

};

export { BlockStateMap }