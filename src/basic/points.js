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
import MD5 from 'md5';
import R from 'ramda';

/*
	INTERNAL DEPENDENCIES
 */

import ReferenceHelper from './reference-helpers';
import TangramReference from '../utils/reference';
import Colors from '../style/colors';

const PR = TangramReference.getPoint(null); // Point reference

/*
	INTERNAL MARKER FUNCTIONS
 */
const getPropertyFnSafe = ReferenceHelper.getPropertyFnSafe;

const getPropertyOrDefFn = ReferenceHelper.getPropertyOrDefFn;

const getEitherProp = ReferenceHelper.getEitherProp;

const getExecutedFn = ReferenceHelper.getExecutedFn;

const getBlendFn = ReferenceHelper.getBlendFn;

const checkMarkerSym = TangramReference.checkSymbolizer('markers');

/**
 * get the internals marker alpha rules global alpha predomines above local alpha's
 * @param  {object} c3ss compiled carto css
 * @return {object}      object with the alpha extracted (global or local)
 */

const getMarkerFillAlpha = getEitherProp('fill-opacity', 'opacity', PR);

const getMarkerStrokeAlpha = getEitherProp('stroke-opacity', 'opacity', PR);

/**
 * get marker c3ss colors
 * @param  {object} c3ss compiled carto css
 * @return {object}      object with the colors
 */
const getMarkerFillColor = getPropertyOrDefFn('fill', PR);

const getMarkerStrokeColor = getPropertyFnSafe('stroke', PR);

/**
 * get colors from cartocss with the alpha channel applied
 * @param  {object} c3ss compiled carto css
 * @return {object}      draw object with color and border_color
 */

const getColor = R.compose(
  (color) => Colors.getAlphaColor(color.fill, color.alpha),
  R.applySpec({
    fill: getMarkerFillColor,
    alpha: getMarkerFillAlpha
  })
);

const getOutlineColor = R.compose(
  (color) => Colors.getAlphaColor(color.stroke, color.alpha),
  R.applySpec({
    stroke: getMarkerStrokeColor,
    alpha: getMarkerStrokeAlpha
  })
);

const getColors = R.compose(
  R.pickBy(R.compose(R.not,R.isNil)),
  R.applySpec({
    color: getColor,
    outline_color: getOutlineColor
  })
);

/**
 * getWidth for the marker and his border
 * @param  {object} c3ss compiled carto css
 * @return {object}      size and border_width
 */

const getMarkerWidth = getPropertyFnSafe('width', PR);

const getOutlineWidth = getPropertyFnSafe('stroke-width', PR);

const getWidths = R.compose(
  R.pickBy(R.compose(R.not, R.isNil)),
  R.applySpec({
    size: getMarkerWidth,
    outline_width: getOutlineWidth
  })
);

/**
 * Get collide from allow-overlap in cartocss [NON-DYNAMIC]
 * @param  {object} c3ss compiled carto css
 * @return {object}      return draw object with a non-dynamic collide option
 */

const getCollide = getExecutedFn('allow-overlap', PR);

const getTextureFile = getExecutedFn('file', PR);

/**
 * Get texture from marker-file in cartocss [NON-DYNAMIC]
 * @param  {object} c3ss compiled carto css
 * @return {object}      return draw object with a non-dynamic texture.
 */
const getTexture = R.compose(
  MD5,
  getTextureFile
);

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

		Object.assign(
				point,
				getColors(c3ss),
				getWidths(c3ss)
			);

    point.collide = !getCollide(c3ss);
	}

  draw['points_' + id] = point;

  return draw;
};

// TODO
/**
 * [getStyle description]
 * @param  {[type]} c3ss  [description]
 * @return {[type]}       [description]
 */
Point.getStyle = function(c3ss, id) {
  let style = {};
  style['points_' + id] = {
    base: 'points',
    blend: 'overlay'
  };

	if (checkMarkerSym(c3ss)) {
		Object.assign(
        style['points_' + id],
        getTexture(c3ss),
        getBlending(c3ss)
      );
	}

	return style;
};

Point.getTextures = function(c3ss) {
	if (checkMarkerSym(c3ss)) {
		let texture = getTextureFile(c3ss);
		let tex = {};

		if (texture) {

			tex[MD5(texture)] = {url: texture};
		}

		return tex;
	}
};
