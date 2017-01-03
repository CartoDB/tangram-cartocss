import Utils from '../utils/utils';

var ReferenceHelpers = {};

let RH = ReferenceHelpers;

export default ReferenceHelpers;

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

RH.generateDefaultFromRef = function(Ref, prop) {
	return { js: Utils.generateDefault(`"${Ref[prop]['default-value']}"`) };
};

RH.defaultAlpha = function(Ref, type) {
	return RH.generateDefaultFromRef(Ref, OPACITY[type]);
};

RH.defaultColor = function(Ref, type) {
	return RH.generateDefaultFromRef(Ref, COLOR[type]);
};
