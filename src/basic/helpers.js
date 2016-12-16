import Utils from '../utils/utils';

var BaseHelpers = {};

let BH = BaseHelpers;

export default BaseHelpers;

const OPACITY = {
	line: 'stroke-opacity',
	point: 'fill-opacity',
	border: 'stroke-opacity',
	global: 'opacity',
	polygon: 'fill-opacity'
};

const COLOR = {
	line: 'stroke',
	point: 'fill',
	polygon: 'fill'
};

BH.generateDefaultFromRef = function(Ref, prop) {
	return { js: Utils.generateDefault(Ref[prop]['default-value']) };
};

BH.defaultAlpha = function(Ref, type) {
	return BH.generateDefaultFromRef(Ref, OPACITY[type]);
};

BH.defaultColor = function(Ref, type) {
	return BH.generateDefaultFromRef(Ref, COLOR[type]);
};
