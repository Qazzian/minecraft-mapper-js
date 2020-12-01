var express = require('express');

const router = express.Router();

/* TODO

	Authentication & session handling
	map select
	fetch map information from the correct map as set by the session
 */

router.use('/chunk/:x/:z', (req, res, next) => {
	const {x, z} = req.params;
	if (!x && !z) {
		next('Coordinates chunk/x/z not defined.');
	} else {
		res('TODO: fetch chunk');
	}
});

router.use('/block/:x/:y/:z', (req, res, next) => {
	const {x, y, z} = req.params;
	if (!x && !y && !z) {
		next('Coordinates block/x/y/z not defined.');
	} else {
		res('TODO: fetch block')
	}
});

