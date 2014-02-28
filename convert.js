var fs = require('fs');
var mr = require('mrcolor');


var xOffset = 1000;
var yOffset = 1000;

var header = '<?xml version="1.0" encoding="utf-8"?>' +
'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + 
'<svg xmlns="http://www.w3.org/2000/svg" version="1.1">' + 
'<g id="viewport" transform="translate(' + xOffset + ', ' + yOffset + ')">\n' + 
'<g>';

var middle = 
'</g>\n' + 
'<g>';

var footer =
'</g>\n' + 
'</g>' + 
'</svg>';

function multitosvg (str) {
	return str.replace(/^\s*MULTIPOLYGON\s*\(\(\(/, 'M')
		.replace(/\)\),\s*\(\(/g, ' Z M')
		.replace(/\),\s*\(/g, ' Z M')
		.replace(/,\s*/g, ' L')
		.replace(/\)\)\)\s*$/, ' Z');
}

function polytosvg (str) {
	return str.replace(/^\s*POLYGON\s*\(\(/, 'M')
		.replace(/,\s*/g, ' L')
		.replace(/\)\)\s*$/, ' Z')
}

function wktToSvg (arr) {
	return header
		+ arr.map(function (a, i) {
			if (!a) { return ''; }
			return '<path fill="' + 'rgb(' + colors[i].rgb().join(',') + ')' + '" d=' + JSON.stringify(a.match(/^\s*MULTI/) ? multitosvg(a) : polytosvg(a)) + '/>';
		}).join(middle)
		+ footer;
}

function binaryBin (arr, fn) {
	console.error('... binning', arr.length);
	if (arr.length == 1) {
		return arr[0];
	} else if (arr.length == 2) {
		return fn(arr[0], arr[1]);
	} else {
		var results = [];
		for (var i = 0; i < arr.length; ) {
			try {
				if (!arr[i + 1]) {
					results.push(arr[i++]);
				} else {
					results.push(fn(arr[i++], arr[i++]));
				}
			} catch (e) {
				console.error(e);
			}
		}
		var whylord = results.filter(function (a) {
			return !a.isGeometryCollectionBase()
		});
		if (whylord.length == 0) {
			throw 'why lord';
		}
		return binaryBin(whylord, fn);
	}
}


var test = require('./test.json');

var colors = mr.take(test.length);

function gridify (a) {
	return Number(a)*10000 | 0;
}

var res = test.map(function (entry, count) {

	console.log(count);
	var shape = entry.children[0];
	// console.log(Object.keys(shape));
	// console.log('-->', Object.keys(shape['geometry IndexedFaceSet']));

	var coordPoints = shape['geometry IndexedFaceSet']['coord Coordinate'].point;
	var coordIndexes = shape['geometry IndexedFaceSet']['coordIndex'];

	// console.log(coords, coordIndexes);

	var coords = [];
	for (var i = 0; i < coordPoints.length; i++) {
		coords.push([gridify(coordPoints[i++]), gridify(coordPoints[i++])]);
	}

	var polys = [];
	for (var i = 0; i < coordIndexes.length; i++) {
		var points = [];
		while (coordIndexes[i] != -1) {
			points.push(coordIndexes[i++]);
		}
		
		var poly = points.map(function (i) { return coords[i].join(' '); });
		poly.push(poly[0]); // close triangles
		polys.push('POLYGON((' + poly.join(', ') + '))');
	}

	// console.log(polys);	

	var jsts = require('jsts');
	var reader = new jsts.io.WKTReader();

	try {
		var result = binaryBin(polys.map(function (str) {
			return reader.read(str);
		}), function (a, b){
			return a.union(b);
		});
	} catch (e) {
		console.error('ERROR, skipping', e);
		return '';
	}

	// console.log(result.isGeometryCollection());

	var out = new jsts.io.WKTWriter().write(result);

var svg = wktToSvg([out]);
// console.log(svg);
fs.writeFileSync('svg/' + count + '.svg', svg);

	return out;
});


var svg = wktToSvg(res);
// console.log(svg);
fs.writeFileSync('output.svg', svg);