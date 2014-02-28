var jsts = require('jsts');

var reader = new jsts.io.WKTReader();
    
var a = reader.read('POLYGON((0 0, 0 2, 2 2, 2 0, 0 0))');
var b = reader.read('POLYGON((1 1, 1 3, 3 3, 3 1, 1 1))');
var c = reader.read('POLYGON((4 4, 4 6, 6 6, 6 4, 4 4))');
// var expected = reader.read('POLYGON((100 50,100 10,10 10,10 100,50 100,50 200,200 200,200 50,100 50))');

var result = a.union(b);


console.log(result);

console.log(new jsts.io.WKTWriter().write(result));