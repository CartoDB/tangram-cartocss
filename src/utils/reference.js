import R from 'ramda';
import reference from 'tangram-reference';

const Ref = reference.load('1.0.0');

var TangramReference = {};

export default TangramReference;

const getProperty = R.curry(function (type, prop) {
	const obj = Ref.symbolizers[type];
	return prop ? obj[prop] : obj;
});

TangramReference.getPoint = getProperty('markers');

TangramReference.getLine = getProperty('line');

TangramReference.getPolygon = getProperty('polygon');

TangramReference.checkSymbolizer = R.curry(function(sym, c3ss) {
	return c3ss.symbolizers.indexOf(sym) !== -1 ? c3ss : null;
});

TangramReference.checkType = R.curry(function(ref, val) {
	return ref.type.indexOf(val) !== -1 ? val : null;
});
