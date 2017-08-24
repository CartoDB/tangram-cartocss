import { compose, curry, either, prop, defaultTo, apply, values, ifElse, applySpec } from 'ramda';
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

const getDefProp = curry((prop, ref) => {
  return generateDefaultFromRef(ref, prop);
});

// ref = 'stroke-opacity' -> get {stroke-opacity: {css: 'line-opacity'}} -> line-opacity;
// ref['line-opacity'];

/**
 * Get the value of a property from a c3ss object given the name
 * of the property as it appears in the given reference.
 *
 * First obtain the name of the CartoCSS property from the
 * given reference and then return the value of the property
 * from the c3ss;
 */
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
