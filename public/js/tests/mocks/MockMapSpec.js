import { MockBlock } from './MockBlock';
import { MockMap } from './MockMap';

describe('mockMap', function () {

	beforeEach(function () {

	});

	afterEach(function () {

	});

	describe('Sanity checks', function () {

		it('should be defined and instantiable', function (done) {
			expect(MockMap).toBeDefined();
			expect(new MockMap()).toBeDefined();
			done();
		});

		it('should conform to the map interface', function (done) {
			// todo takes event handlers
			const testMap = new MockMap();
			expect(testMap.requestBlock).toBeDefined();
			expect(testMap.requestTopBlock).toBeDefined();
			expect(testMap.requestArea).toBeDefined();
			done();
		});
	});

	describe('Creating and returning mock blocks', function () {

		beforeEach(function () {

		});

		afterEach(function () {

		});

		it('should return a block', function (done) {
			this.testMap = new MockMap(); // todo event handlers
			const blockPromise = this.testMap.requestBlock({x:0,y:0,z:0});
			expect(blockPromise).toBeDefined();
			expect(blockPromise instanceof Promise).toBe(true);
			blockPromise.then((blockData) => {
				expect(blockData.block.id).toBe(1);
				expect(blockData.position).toBeDefined();
			});
			done();
		});

	});
});