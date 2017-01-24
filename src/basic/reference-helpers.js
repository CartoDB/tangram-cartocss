import R from 'ramda';
import Utils from '../utils/utils';
import TangramReference from '../utils/reference';
import Colors from '../style/colors';


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

const getPropertyFnSafe = R.ifElse(
  getProp,
  getPropertyFn,
  () => void 0
);

const getPropertyOrDefFn = curryComp(R.compose(
  Utils.buildCCSSFn,
  R.prop('js'),
  getPropOrDef
));

const getEitherProp = (propA, propB, ref) => R.either(
  getPropertyFnSafe(propA, ref),
  getPropertyOrDefFn(propB, ref)
);

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

const getColorFn = (fill, alpha) => {
  return R.compose(
    R.apply(Colors.getAlphaColor),
    R.values,
    R.applySpec({
      fill: fill,
      alpha: alpha
    })
  );
};

export {
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
