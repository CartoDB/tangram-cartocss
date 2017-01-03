import reference from 'tangram-reference';

const Ref = reference.load('1.0.0');

var TangramReference = {};

export default TangramReference;

const getProperty = function (type, prop) {
	const obj = Ref.symbolizers[type];
	return prop ? obj[prop] : obj;
};

TangramReference.getPoint = function(prop) {
	return getProperty('markers', prop);
};

TangramReference.getLine = function(prop) {
	return getProperty('line', prop);
};

TangramReference.getPolygon = function(prop) {
	return getProperty('polygon', prop);
};

TangramReference.checkSymbolizer = function(c3ss, sym) {
	return c3ss.symbolizers.indexOf(sym) !== -1;
};

TangramReference.checkType = function(ref, val) {
	return ref.type.indexOf(val) !== -1;
};