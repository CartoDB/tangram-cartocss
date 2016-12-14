import Ref from 'tangram-reference';

var TR = {};

export default TR;

const getProperty (type, prop) {
	const obj = Ref.symbolizers[type];
	return prop ? obj[prop] : obj;
}

TR.getPoint = function(prop) {
	return getProperty('markers', prop);
};

TR.getLine = function(prop) {
	return getProperty('line', prop);
};

TR.getPolygon = function(prop) {
	return getProperty('polygon', prop);
};

TR.checkSymbolizer = function(c3ss, sym) {
	return c3ss.symbolizers.indexOf(sym) !== -1;
};