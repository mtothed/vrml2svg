var fs = require('fs');
var carrier = require('carrier');


var STATES = [[]];

carrier.carry(fs.createReadStream('test.wrl'), function (line) {
	var indent = line.match(/^(  )*/)[0].length / 2;

	lines = line.replace(/(\S+)\s*([\}\]])/g, '$1\n$2').split(/\r?\n+/g);

	lines.forEach(function (line) {
		while (true) {
			if (line.match(/^[^\[]+\{/)) {
				var key = line.match(/^\s*([^\]]+?)\s*\{/)[1];
				line = line.replace(/(.*?)\{/, '');
				
				console.log('OBJ', key);
				var obj = { };
				if (Array.isArray(STATES[0])) {
					obj.$TYPE = key;
					STATES[0].push(obj);
				} else {
					STATES[0][key] = obj;
				}
				STATES.unshift(obj);

			} else if (line.match(/^[^\{]+\[/)) {
				var key = line.match(/^\s*([^\{]+?)\s*\[/)[1];
				line = line.replace(/(.*?)\[/, '');
				
				console.log('ARR', key);
				var arr = []; 
				if (Array.isArray(STATES[0])) {
					arr.$TYPE = key;
					STATES[0].push(arr);
				} else {
					STATES[0][key] = arr;
				}
				STATES.unshift(arr);

			} else if (line.match(/^\s*\}/)) {
				console.log('CLOSEOBJ', '}');
				line = line.replace(/^\s*\}/, '')

				// TODO check
				STATES.shift();

			} else if (line.match(/^\s*\]/)) {
				console.log('CLOSEARR', ']');
				line = line.replace(/^\s*\]/, '')

				// TODO check
				STATES.shift();

			} else if (line.match(/[\{\}\[\]]/)) {
				console.error('Mismatched parens:\n', line);
				process.exit(1);

			} else if (line.match(/^\s*(#|$)/)) {
				break;
			
			} else if (Array.isArray(STATES[0])) {
				var entries = line.split(/\s+|\s*\,\s*/g).filter(function (a) {
					return a;
				}).map(function (a) {
					var arg = a.replace(/^\s+|\s+$/g, '');
					if (String(parseFloat(arg)) == arg) {
						return parseFloat(arg);
					}
					return arg;
				});
				STATES[0].push.apply(STATES[0], entries);
				line = '';
			
			} else if (line.match(/^\s*\w+/)) {
				var key = line.match(/^\s*(\w+)/)[1];
				line = line.replace(/^\s*(\w+)/, '');

				var entries = line.split(/\s+|\s*\,\s*/g).filter(function (a) {
					return a;
				}).map(function (a) {
					var arg = a.replace(/^\s+|\s+$/g, '');
					if (String(parseFloat(arg)) == arg) {
						return parseFloat(arg);
					}
					return arg;
				});
				STATES[0][key] = entries;
				line = '';

				console.log('PROP', key, entries);

			} else {
				break;
			}
		}
	});
}).on('end', function () {
	fs.writeFileSync('test.json', JSON.stringify(STATES[0]), 'utf-8');
})