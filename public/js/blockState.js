/**
 * Created by ian-wallis on 26/02/2017.
 */

function MetaFields (stateName, variantName) {
	return {
		stateName: stateName,
		variantName: variantName || 'normal'
	};
}

let blockStateCache = {};

let BlockState = {
	getState: function(block) {
		let stateData;
		if (typeof BlockState[block.type] === 'function') {
			stateData = BlockState[block.type](block);
		}
		else {
			stateData = BlockState.byDisplayName(block);
		}
		return stateData;
	},

	loadBlockStates: async function(block) {
		let {name, stateName, variantName} = BlockState.getState(block);

		let blockStateResponse;
		if (!blockStateCache[stateName]) {
			try {
				blockStateResponse = await fetch(`/blockstates/${stateName}.json`);
			}
			catch (error) {
				blockStateResponse = await fetch(`/blockstates/${name}.json`);
			}
		}
		const stateData = blockStateCache[stateName] = blockStateResponse.json();

		if (stateData.variants && stateData.variants[variantName]) {
			let variant = stateData.variants[variantName];
			if (Array.isArray(variant)) {
				variant = variant[0];
			}
			return variant;
		}
		else {
			throw new Error('UNSUPPORTED: variant data missing.', stateData);
		}
	},

	byName: function(block, variantName) {
		return MetaFields(block.name, variantName);
	},
	byDisplayName: function(block, variantName) {
		return MetaFields(block.displayName.toLowerCase().replace(/\s/, '_'), variantName);
	},
	// air
	0: function(){
		return MetaFields('air');
	},
	// stone
	1: function(block) {
		const stoneTypes = [
			'stone',
			'granite',
			'smooth_granite',
			'diorite',
			'smooth_diorite',
			'andesite',
			'smooth_andesite'
		];
		return MetaFields(stoneTypes[block.metadata]);
	},
	// grass
	2: function (block) {
		const varList = ['snowy=false', 'snowy=true'];
		// TODO snowy value comes from inspecting the block above
		return MetaFields(block.name, varList[block.metadata]);
	},
	// log
	17: function(block) {
		const materialPart = block.metadata & 0b11;
		const directionPart = block.metadata & 0b1100;

		const materials = [ 'oak', 'spruce', 'birch', 'jungle'];
		const directions = ["axis=y", "axis=z", "axis=x", "axis=none"];

		return MetaFields(
			materials[materialPart] + '_log',
			directions[directionPart >> 2]
		);
	},
	// leaves
	18: function (block) {
		const materialPart = block.metadata & 0b11;
		const materials = [ 'oak', 'spruce', 'birch', 'jungle'];
		return MetaFields(materials[materialPart] + '_leaves');
	},
	// red_flower
	38: function (block) {
		const types = [
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

		return MetaFields(types[block.metadata]);
	},
	// snow
	78: function (block) {
		const layers = ["layers=1","layers=2","layers=3","layers=4","layers=5","layers=6","layers=7","layers=8"];

		return BlockState.byName(block, layers[block.metadata]);
	},
	// reeds
	83: function (block) {
		return BlockState.byName(block);
	},
	// double_plant
	175: function (block) {
		const materialPart = block.metadata & 0b111;
		const isTop = !!(block.metadata & 0b1000);
		const types = [
			'sunflower',
			'syringa',
			'double_grass',
			'double_fern',
			'double_rose',
			'paeonia'
		];
		let section = isTop ? "half=upper" : "half=lower";
		return MetaFields(types[materialPart], section);
	}

};

export { BlockState }
