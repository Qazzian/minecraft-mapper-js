const chunk = {

	getSection(chunkNbt, index) {
		const sectionList = chunkNbt.value.Level.value.Sections;
		return sectionList.value.value[index];
	},

	parseSectionBlockStates(sectionNbt) {
		if (!sectionNbt) {
			return new Array(4096).fill('minecraft:air');
		}

		const paletteList = chunk.parseSectionPalette(sectionNbt);
		const bitDepth = chunk.getBitDepth(paletteList.length);
		const blockStates = sectionNbt.BlockStates.value;
		const blockIndexes = chunk.blockStatesToInts(blockStates, bitDepth);
		return blockIndexes.map((blockIndex) => paletteList[blockIndex]);
	},

	/**
	 * @param {Number} index: The block index within the section
	 * @returns {Object} {x, y, z} of the block within the section
	 */
	getSectionCoords(index) {
		return {
			x: index % 16,
			z: Math.floor(index / 16) % 16,
			y: Math.floor(index / (16 * 16)),
		};
	},

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @returns {number}
	 */
	sectionCoordsToIndex({x, y, z}) {
		return (y * 16 * 16) + (z * 16) + x;
	},

	/**
	 * Given the coordinates of a block relative to the section
	 * and the index of the section within the chunk,
	 * return the coordinates relative to the chunk.
	 * @param {Object} coords: {x, y, z}
	 * @param {Number} yIndex
	 * @returns {{x: number, y: number, z: number}}
	 */
	sectionCoordsToChunkCoords(coords, yIndex) {
		return Object.assign(
			{},
			coords,
			{
				y: coords.y + (yIndex * 16)
			}
		);
	},

	/**
	 * Given block coordinates relative to the chunk,
	 * return the coordinates relative to the section
	 * and the index of the section
	 * @param x
	 * @param y
	 * @param z
	 * @returns {{section: number, coords: {x: number, y: number, z: number}}}
	 */
	chunkCoordsToSectionCoords({x, y, z}) {
		return {
			section: Math.floor(y / 16),
			coords: {x, y: y % 16, z},
		};
	},

	/**
	 * Return an array of block id's preserving the order in the pallet.
	 * @param sectionNbt
	 */
	parseSectionPalette(sectionNbt) {
		const paletteList = sectionNbt.Palette.value.value;
		return paletteList.map(blockNbt => blockNbt.Name.value);
	},

	getBitDepth(palletLength) {
		let shifted = palletLength;
		let shiftCount = 0;
		while (shifted > 0) {
			shiftCount++;
			shifted = shifted >> 1;
		}
		return Math.max(shiftCount, 4);
	},


	/**
	 * Convert the packed up block ids from an array of longs into an
	 * array of block indexes.
	 * @param blockStates
	 * @param bitDepth
	 * @returns {Array}
	 */
	blockStatesToInts(blockStates, bitDepth) {
		const longCount = blockStates.length;
		const intList = [];
		let currentLong = 0;
		let currentBit = 0;
		do {
			let newInt = 0;
			if (currentBit + bitDepth > 64) {
				if (currentLong + 1 < longCount) {
					const overflowLong = [
						blockStates[currentLong][1],
						blockStates[currentLong + 1][0],
					];
					newInt = chunk.getIntFromLong(overflowLong, currentBit - 32, bitDepth);
				}
			} else {
				newInt = chunk.getIntFromLong(blockStates[currentLong], currentBit, bitDepth);
			}
			intList.push(newInt);
			currentBit += bitDepth;
			if (currentBit >= 64) {
				currentLong += 1;
				currentBit = currentBit % 64;
			}
		} while (currentLong < longCount);

		return intList;
	},

	/**
	 * Block states are read from nbt format as an array of 64bit longs.
	 * But because Javascript can only do bitwise operations on 32 each long
	 * needs to be split into 2 32bit components.
	 * @param long {[Number, Number]} - an array of 2 32bit Numbers
	 * @param bitPos {Number} - where to start reading from
	 * @param bitDepth {Number} - how many bits to read
	 * @returns {Number}
	 */
	getIntFromLong(long, bitPos, bitDepth) {
		// Deal with numbers that sit on the border of the 2 numbers
		if (bitPos < 32 && (bitPos + bitDepth) > 32) {
			// The bits that are in the first half of the long
			const underflow = 32 - bitPos;
			// the bits in the second half
			const overflow = bitDepth - underflow;
			const int1 = chunk.getIntFromLong(long, bitPos, underflow) << bitDepth - underflow;
			const int2 = chunk.getIntFromLong(long, 32, overflow);
			return int1 + int2;
		}
		const workingInt = bitPos < 32 ? long[0] : long[1];
		const workingPos = bitPos % 32;

		let int = workingInt << workingPos;
		const out = int >>> (32 - bitDepth);
		// console.info('working:', workingInt, workingInt.toString(2),
		// 	'\nshifted by ', workingPos, int.toString(2),
		// 	'\nshifted back by ', 32 - bitDepth, out, out.toString(2));
		return out;
	},

	// Note removed for performance reasons
	__iter: function* (nbtData) {
		const sectionIter = chunk.iterSections(nbtData);
		let sectionNode = sectionIter.next();

		while(!sectionNode.done) {
			const blockIter = chunk.iterSectionBlocks(sectionNode.value.nbt);
			let blockNode = blockIter.next();

			while (!blockNode.done) {
				const block = blockNode.value;
				block.chunkPos = chunk.sectionCoordsToChunkCoords(block.sectionPos, sectionNode.value.index);
				yield block;
				blockNode = blockIter.next();
			}
			sectionNode = sectionIter.next();
			// sectionNode.done = true;
		}
	},

	iterSections: function* (chunkNbt) {
		for(let sectionIndex=0; sectionIndex<16; ++sectionIndex) {
			yield {
				index: sectionIndex,
				nbt: chunk.getSection(chunkNbt, sectionIndex),
			};
		}
	},

	iterSectionBlocks: function* (sectionNbt) {
		const blockStates = chunk.parseSectionBlockStates(sectionNbt);

		for (let i=0; i<blockStates.length; i++) {
			yield {
				state: blockStates[i],
				sectionPos: chunk.getSectionCoords(i)
			};
		}
	},
};

export default chunk;
