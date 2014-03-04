#!/usr/bin/env node

var fs = require('fs');

if (process.argv.length < 4) {
	console.error('Usage: vrml2svg input.wrl output.svg');
	process.exit(1);
}

require('./parse').parse(fs.createReadStream(process.argv[2]), function (err, struct) {
	require('./generate').generate(fs.createWriteStream(process.argv[3]), struct, function () {
		console.error('Done.');
	});
})