const ramda = require('ramda');
const either = ramda.either;
const prop = ramda.prop;
const defaultTo = ramda.defaultTo;
const apply = ramda.apply;
const values = ramda.values;
const ifElse = ramda.ifElse;
const applySpec = ramda.applySpec;
const curry = ramda.curry;
const compose = ramda.compose;

const Utils = require('../utils/utils');
const TangramReference = require('../utils/reference');
const Colors = require('../style/colors');

/*
  INTERNAL REFERENCE FUNCTIONS
 */

const curryComp = Utils.curryCompose3;

/*
  REFERENCE HELPER
 */

const generateDefaultFromRef = function(Ref, prop) {
	return { js: Utils.generateDefault(`"${Ref[prop]['default-value']}"`) };
};

const getDefProp = curry((prop, ref) => {
  return generateDefaultFromRef(ref, prop);
});

// ref = 'stroke-opacity' -> get {stroke-opacity: {css: 'line-opacity'}} -> line-opacity;
// ref['line-opacity'];
const getProp = curry((prop, ref, c3ss) => {
  return Utils.pick(Utils.pick(prop + '.css', ref), c3ss);
});

const getPropOrDef = either(getProp, getDefProp);


const getPropertyFn = curryComp(compose(
  Utils.buildCCSSFn,
  prop('js'), // get property js from object
  getProp
));

const getPropertyFnSafe = ifElse(
  getProp,
  getPropertyFn,
  () => void 0
);

const getPropertyOrDefFn = curryComp(compose(
  Utils.buildCCSSFn,
  prop('js'),
  getPropOrDef
));

const getEitherProp = (propA, propB, ref) => either(
  getPropertyFnSafe(propA, ref),
  getPropertyOrDefFn(propB, ref)
);

const getExecutedFn = curryComp(compose(
  Utils.buildAndExecuteFn,
  prop('js'),
  getPropOrDef
));

const getBlendFn = curry((ref, c3ss) => compose(
  defaultTo('overlay'),
  TangramReference.checkType(ref['comp-op']),
  getExecutedFn('comp-op')
)(ref, c3ss));

const getColorFn = (fill, alpha) => {
  return compose(
    apply(Colors.getAlphaColor),
    values,
    applySpec({
      fill: fill,
      alpha: alpha
    })
  );
};

module.exports = {
  generateDefaultFromRef,
  getDefProp,
  getProp,
  getPropOrDef,
  getPropertyFn,
  getPropertyFnSafe,
  getPropertyOrDefFn,
  getEitherProp,
  getExecutedFn,
  getBlendFn,
  getColorFn
};
