var fs = require('fs');
var mr = require('mrcolor');
var clipper = require('clipper');


var unionScale = 1e6;
var outputScale = 1e4;

var xOffset = 500;
var yOffset = 500;

var header = '<?xml version="1.0" encoding="utf-8"?>' +
'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + 
'<svg xmlns="http://www.w3.org/2000/svg" version="1.1">' + 
'<g id="viewport" transform="translate(' + xOffset + ', ' + yOffset + ')">\n'

var footer = '\n</g>' + 
'</svg>';

exports.generate = function (output, test, next) {

	function clippertosvg (clip) {
		var str = [];

		for (var i = 0; i < clip.out.length; ) {
			var poly = clip.out[i++];
			var points = [];
			for (var j = 0; j < poly.length; ) {
				points.push((poly[j++]/(unionScale/outputScale)) + ' ' + (poly[j++]/(unionScale/outputScale)))
			}
			str.push('M' + points.join(' L') + ' Z')
		}

		for (var i = 0; i < clip.in.length; ) {
			var poly = clip.in[i++];
			var points = [];
			for (var j = 0; j < poly.length; ) {
				points.push((poly[j++]/(unionScale/outputScale)) + ' ' + (poly[j++]/(unionScale/outputScale)))
			}
			str.push('M' + points.join(' L') + ' Z')
		}

		return str.join(' ');
	}

	function wktToSvg (arr) {
		return header
			+ arr.map(function (a, i) {
				if (!a.out || !a.out.length) return '';

				var appearance = test[i].children[0]['appearance Appearance'];
				var material = appearance[Object.keys(appearance)];

				console.log(i);

				return '<path fill-rule="evenodd" fill="' + 'rgb(' + material.diffuseColor.map(function (a) {
					return (a*100).toFixed(2) + '%'
				}).join(',') + ')' + '" d='
					+ JSON.stringify(clippertosvg(a))
					+ '/>';
			}).join('\n')
			+ footer;
	}

	function isordered (poly) {
		var a = poly[0]; b = poly[1]; c = poly[2];

		// http://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-points-are-in-clockwise-order
		var orderup
			= (b[0] - a[0])*(b[1] + a[1])
			+ (c[0] - b[0])*(c[1] + b[1])
			+ (a[0] - c[0])*(a[1] + c[1])

		return orderup < 0;
	}

	function order (poly) {
		if (isordered(poly) > 0) {
			var tmp = poly[2];
			poly[2] = poly[0];
			poly[0] = poly[2];
			return order(poly);
		}
	}


	function gridify (a) {
		return Number(a)*unionScale | 0;
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
				points.unshift(coords[coordIndexes[i++]]);
			}
			if (isordered(points)) {
				polys.unshift([].concat.apply([], points));
			}
		}

		var union = clipper.union.apply(clipper, polys);
		return union;
	});


	var svg = wktToSvg(res);
	output.write(svg);
	output.end();
	next && next();
}