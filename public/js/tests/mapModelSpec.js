import { MapModel } from '../mapModel';
import { MockMap } from './mocks/MockMap';


describe('MapModel', function () {

	beforeEach(function () {

	});

	afterEach(function () {

	});

	describe('sanity checks', function () {

		beforeEach(function () {
			this.mapConnection = new MockMap();
			this.mapModel = new MapModel(this.mapConnection);
		});

		afterEach(function () {
		});

		it('MapModel should be defined', function (done) {
			expect(MapModel).toBeDefined();
			expect(this.mapModel).toBeDefined();
			done();
		});

		it('should return a promise when a block is requested', function (done) {
			let requestPromise = this.mapModel.getBlock([0, 0, 0]);
			expect(requestPromise instanceof Promise).toBe(true);
			done();
		});

		// TODO convert MapModel to promise structure

	});

});