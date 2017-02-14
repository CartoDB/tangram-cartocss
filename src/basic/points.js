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
import {compose, pickBy, not, isNil, applySpec} from 'ramda';

/*
	INTERNAL DEPENDENCIES
 */

import { getExecutedFn, getPropertyOrDefFn, getBlendFn, getPropertyFnSafe, getEitherProp, getColorFn } from '../utils/reference-helpers';
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

const getWidths = compose(
  pickBy(compose(not, isNil)),
  applySpec({
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
const getTexture = compose(
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
Point.getStyle = function(c3ss, id, ord) {
  let style = {};
  style['points_' + id] = {
    base: 'points',
    blend: 'overlay',
    blend_order: ord || 1
  };

	if (checkMarkerSym(c3ss)) {
    let p = style['points_' + id];
    p.texture = getTextureFile(c3ss) !== 'none' ? getTexture(c3ss) : void 0;
    p.blend = getBlending(c3ss);
	}

	return style;
};

Point.getTextures = function(c3ss) {
  let tex = {};
	if (checkMarkerSym(c3ss)) {
		let texture = getTextureFile(c3ss);

		if (texture !== 'none') {
			tex[MD5(texture)] = {url: texture};
		}

		return tex;
	}
};
