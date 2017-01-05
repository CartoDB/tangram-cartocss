import R from 'ramda';
import Utils from '../utils/utils';
import TangramReference from '../utils/reference';


/*
  INTERNAL REFERENCE FUNCTIONS
 */

const curryComp = Utils.curryCompose3;


/*
  REFERENCE HELPER
 */
var ReferenceHelper = {};

let RH = ReferenceHelper;

export default ReferenceHelper;

// NOTE: to be removed ////
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
///////////////////////////

RH.generateDefaultFromRef = function(Ref, prop) {
	return { js: Utils.generateDefault(`"${Ref[prop]['default-value']}"`) };
};

RH.defaultAlpha = function(Ref, type) {
	return RH.generateDefaultFromRef(Ref, OPACITY[type]);
};

RH.defaultColor = function(Ref, type) {
	return RH.generateDefaultFromRef(Ref, COLOR[type]);
};

RH.getDefProp = R.curry((prop, ref) => {
  return RH.generateDefaultFromRef(ref, prop);
});

// ref = 'stroke-opacity' -> get {stroke-opacity: {css: 'line-opacity'}} -> line-opacity;
// ref['line-opacity'];
RH.getProp = R.curry((prop, ref, c3ss) => {
  return Utils.pick(Utils.pick(prop + '.css', ref), c3ss);
});

RH.getPropOrDef = R.either(RH.getProp, RH.getDefProp);


RH.getPropertyFn = curryComp(R.compose(
  Utils.buildCCSSFn,
  R.prop('js'), // get property js from object
  RH.getProp
));

RH.getPropertyOrDefFn = curryComp(R.compose(
  Utils.buildCCSSFn,
  R.prop('js'),
  RH.getPropOrDef
));

RH.getExecutedFn = curryComp(R.compose(
  Utils.buildAndExecuteFn,
  R.prop('js'),
  RH.getPropOrDef
));

RH.getBlendFn = R.curry((ref, c3ss) => R.compose(
  R.defaultTo('overlay'),
  TangramReference.checkType(ref['comp-op']),
  RH.getExecutedFn('comp-op')
)(ref, c3ss));
