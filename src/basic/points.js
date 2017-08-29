/*
	 ________  ________  ___  ________   _________
	|\   __  \|\   __  \|\  \|\   ___  \|\___   ___\
	\ \  \|\  \ \  \|\  \ \  \ \  \\ \  \|___ \  \_|
	 \ \   ____\ \  \\\  \ \  \ \  \\ \  \   \ \  \
	  \ \  \___|\ \  \\\  \ \  \ \  \\ \  \   \ \  \
	   \ \__\    \ \_______\ \__\ \__\\ \__\   \ \__\
	    \|__|     \|_______|\|__|\|__| \|__|    \|__|

 */

/*
	EXTERNAL DEPENDENCIES
 */
import { compose, pickBy, not, isNil, applySpec, merge, mergeWith } from 'ramda';

/*
	INTERNAL DEPENDENCIES
 */

import { getPropertyOrDefFn, getPropertyFnSafe, getEitherProp, getColorFn, getProp } from '../utils/reference-helpers';
import { buildCCSSFn } from '../utils/utils';
import TangramReference from '../utils/reference';

const PR = TangramReference.getPoint(null); // Point reference

/*
	INTERNAL MARKER FUNCTIONS
 */

const checkMarkerSym = TangramReference.checkSymbolizer('markers');

/**
 * get colors from cartocss with the alpha channel applied
 * @param  {object} c3ss compiled carto css
 * @return {object}      draw object with color and border_color
 */

const getColor = getColorFn(
  getPropertyOrDefFn('fill', PR),
  getEitherProp('fill-opacity', 'opacity', PR)
);

const getOutlineColor = getColorFn(
  getPropertyFnSafe('stroke', PR),
  getEitherProp('stroke-opacity', 'opacity', PR)
);

const getColors = compose(
  pickBy(compose(not, isNil)),
  applySpec({
    color: getColor,
    outline: {
      color: getOutlineColor
    }
  })
);


/**
 * Return a function used by tangram to calculate the point.size at runtime
 */
function getMarkerWidth(c3ss) {
  const NULL_VALUE = 0;
  let property = getProp('width', PR, c3ss);
  if (property) {
    return buildCCSSFn(property.js, undefined, NULL_VALUE);
  }
  if (c3ss.symbolizers.includes('markers')) {
    return PR.width['default-value'];
  }
  return () => undefined;
}

const getOutlineWidth = getPropertyFnSafe('stroke-width', PR);

const getWidths = compose(
  pickBy(compose(not, isNil)),
  applySpec({
    size: getMarkerWidth,
    outline: {
      width: getOutlineWidth
    }
  })
);

/**
 * Get collide from allow-overlap in cartocss [NON-DYNAMIC]
 * @param  {object} c3ss compiled carto css
 * @return {bolean}      return evaluated collide option
 */
export function getCollide(c3ss) {
  let allowOverlap = PR['allow-overlap']['default-value'];
  let property = c3ss['marker-allow-overlap'];
  if (property) {

    // We dont support filtered marker-allow-overlap
    if (property.filtered) {
      throw new Error('marker-allow-overlap is not supported inside filters');
    }

    // Since this property is not-dynamic must be evaluated.
    allowOverlap = property.style({}, { zoom: 10 });
  }
  return !allowOverlap;
}

/**
 * Helper function used to translate mapnik comp-ops to tangram.
 */
function _transpileCompOp(propertyName) {
  switch (propertyName) {
    case 'src-over':
      return 'overlay';
    case 'multiply':
      return 'multiply';
    case 'plus':
      return 'add';
    default:
      throw new Error('Invalid marker-comp-op value: ' + propertyName);
  }
}

/**
 * Get the blending mode for the marker.
 * @param {*} c3ss compiled cartocss.
 * @return {string} Tangram render mode:
 */
export function getBlending(c3ss) {
  let defaultValue = PR['comp-op']['default-value'];
  let compOp = c3ss['marker-comp-op'];
  if (!compOp) {
    return _transpileCompOp(defaultValue);
  }
  // We dont support filtered marker-comp-op
  if (compOp.filtered) {
    throw new Error('marker-comp-op is not supported inside filters');
  }
  // Since this property is not-dynamic must be evaluated.
  return _transpileCompOp(compOp.style({}, { zoom: 10 }));
}

/**
 * Basic point
 */

var Point = {};

export default Point;

/**
 * Get the draw (for tangram) object of a point from compiled carto css
 * @param  {object} c3ss compiled carto @class
 * @return {object}      object with the draw types and their properties
 */
Point.getDraw = function (c3ss, id) {
  var point = {},
    draw = {};

  if (checkMarkerSym(c3ss)) {

    point = mergeWith(
      merge,
      getWidths(c3ss),
      getColors(c3ss)
    );

    point.collide = getCollide(c3ss);
  }
  point.order = 0;
  draw['points_' + id] = point;

  return draw;
};

// TODO
/**
 * [getStyle description]
 * @param  {[type]} c3ss  [description]
 * @return {[type]}       [description]
 */
Point.getStyle = function (c3ss, id, ord) {
  let style = {};
  style['points_' + id] = {
    base: 'points',
    blend: 'overlay',
    blend_order: ord || 1
  };

  if (checkMarkerSym(c3ss)) {
    let p = style['points_' + id];
    p.blend = getBlending(c3ss);
  }

  return style;
};
