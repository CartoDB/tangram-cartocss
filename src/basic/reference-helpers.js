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

const generateDefaultFromRef = function(Ref, prop) {
	return { js: Utils.generateDefault(`"${Ref[prop]['default-value']}"`) };
};

const defaultAlpha = function(Ref, type) {
	return generateDefaultFromRef(Ref, OPACITY[type]);
};

const defaultColor = function(Ref, type) {
	return generateDefaultFromRef(Ref, COLOR[type]);
};

const getDefProp = R.curry((prop, ref) => {
  return generateDefaultFromRef(ref, prop);
});

// ref = 'stroke-opacity' -> get {stroke-opacity: {css: 'line-opacity'}} -> line-opacity;
// ref['line-opacity'];
const getProp = R.curry((prop, ref, c3ss) => {
  return Utils.pick(Utils.pick(prop + '.css', ref), c3ss);
});

const getPropOrDef = R.either(getProp, getDefProp);


const getPropertyFn = curryComp(R.compose(
  Utils.buildCCSSFn,
  R.prop('js'), // get property js from object
  getProp
));

const getPropertyOrDefFn = curryComp(R.compose(
  Utils.buildCCSSFn,
  R.prop('js'),
  getPropOrDef
));

const getExecutedFn = curryComp(R.compose(
  Utils.buildAndExecuteFn,
  R.prop('js'),
  getPropOrDef
));

const getBlendFn = R.curry((ref, c3ss) => R.compose(
  R.defaultTo('overlay'),
  TangramReference.checkType(ref['comp-op']),
  getExecutedFn('comp-op')
)(ref, c3ss));

var ReferenceHelper = {
  generateDefaultFromRef,
  defaultAlpha,
  defaultColor,
  getDefProp,
  getProp,
  getPropOrDef,
  getPropertyFn,
  getPropertyOrDefFn,
  getExecutedFn,
  getBlendFn
};

export default ReferenceHelper;
