/**
 * Created by ian-wallis on 26/02/2017.
 */

var MetaFields = function(stateName, variantName) {
	this.stateName = stateName;
	this.variantName = variantName || 'normal';
}

var BlockStateMap = {
	byName: function(block) {
		return new MetaFields(block.name);
	},
	byDisplayName: function(block) {
		return new MetaFields(block.displayName.toLowerCase().replace(/\s/, '_'));
	},
	// air
	0: function(block){
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
	}

};

export { BlockStateMap }