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
import {compose, pickBy, not, isNil, applySpec, merge, mergeWith} from 'ramda';

/*
	INTERNAL DEPENDENCIES
 */

import { getExecutedFn, getPropertyOrDefFn, getBlendFn, getPropertyFnSafe, getEitherProp, getColorFn, getProp } from '../utils/reference-helpers';
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
  pickBy(compose(not,isNil)),
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
  let defaultValue = 0;
  let property = getProp('width', PR, c3ss);
  if (property) {
    return buildCCSSFn(property.js, undefined, defaultValue);
  }
  return () => void 0;
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
 * @return {object}      return draw object with a non-dynamic collide option
 */

export const getCollide = getExecutedFn('allow-overlap', PR);

const getBlending = getBlendFn(PR);

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
Point.getDraw = function(c3ss, id) {
	var point = {},
      draw = {};

	if (checkMarkerSym(c3ss)) {

		point = mergeWith(
        merge,
				getWidths(c3ss),
				getColors(c3ss)
			);

    point.collide = !getCollide(c3ss);
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
Point.getStyle = function(c3ss, id, ord) {
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
