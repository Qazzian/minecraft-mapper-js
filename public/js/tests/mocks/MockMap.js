import { MockBlock } from './MockBlock';

class MockMap {
	constructor() {

	}

	requestBlock(pos) {
		return new Promise((resolve, reject) => {
			resolve({
				block: new MockBlock(),
				position: pos
			});
		});
	}

	requestTopBlock() {

	}

	requestArea() {

	}

	requestChunk(pos) {

	}
}

export { MockMap };