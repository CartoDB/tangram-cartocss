/*
 ________  ________  ___           ___    ___ ________  ________  ________   ________
|\   __  \|\   __  \|\  \         |\  \  /  /|\   ____\|\   __  \|\   ___  \|\   ____\
\ \  \|\  \ \  \|\  \ \  \        \ \  \/  / | \  \___|\ \  \|\  \ \  \\ \  \ \  \___|_
 \ \   ____\ \  \\\  \ \  \        \ \    / / \ \  \  __\ \  \\\  \ \  \\ \  \ \_____  \
  \ \  \___|\ \  \\\  \ \  \____    \/  /  /   \ \  \|\  \ \  \\\  \ \  \\ \  \|____|\  \
   \ \__\    \ \_______\ \_______\__/  / /      \ \_______\ \_______\ \__\\ \__\____\_\  \
    \|__|     \|_______|\|_______|\___/ /        \|_______|\|_______|\|__| \|__|\_________\
                                 \|___|/                                       \|_________|

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

const PR = TangramReference.getPolygon(null); // Polygon reference
const PPR = TangramReference.getPolygonPattern(null);

/*
	INTERNAL POLYGONS FUNCTIONS
 */

const getExecutedFn = ReferenceHelper.getExecutedFn;

const getPropertyOrDefFn = ReferenceHelper.getPropertyOrDefFn;

const getBlendFn = ReferenceHelper.getBlendFn;

const checkPolygonSym = TangramReference.checkSymbolizer('polygon');
const checkPolPatternSym = TangramReference.checkSymbolizer('polygon-pattern');

/**
 * function tha returns the alpha from a polygon
 *
 * @param   {object} c3ss compiled carto css
 * @returns {function} function that returns an alpha value
 */

const getAlpha = getPropertyOrDefFn('fill-opacity', PR);

/**
 * Function to get the compiled carto css for the color property
 *
 * @param   {object} c3ss compiled carto css
 * @returns {object} with the compiled carto css for the color property
 */

const getBaseColor = getPropertyOrDefFn('fill', PR);

/**
 * Function for getting the color in rgba
 *
 * @param   {object} c3ss compiled carto css
 * @returns {object} with a function that contain the conditions to return a color with alpha channel
 */
const getColor = function (c3ss) {
	const color = getBaseColor(c3ss);
	const alpha = getAlpha(c3ss);

	return Colors.getAlphaColor(color, alpha);
};

const getTextureFile = getExecutedFn('file', PPR);

const getTexture = R.compose(
  MD5,
  getTextureFile
);

const getBlending = getBlendFn(PR);

/**
 * Basic Polygon
 */

var Polygon = {};

export default Polygon;

/**
 * Function to get the draw object of a polygon.
 *
 * @param   {object} c3ss compiled carto css
 * @returns {function} function with the conditions to return alpha value
 */
Polygon.getDraw = c3ss => {

  if (checkPolygonSym(c3ss)) {
    return {
      polygons_blend: {
        color: getColor(c3ss)
      }
    };
  }

  return {};
};

/**
 * Function to get the style configuration of a polygon.
 *
 * @returns default style configuration for polygon
 */
Polygon.getStyle = function(c3ss) {
	let style = {
		polygons_blend: {
			base: 'polygons',
			blend: getBlending(c3ss),
      material: {
        diffuse: {
          texture: checkPolPatternSym(c3ss) ? getTexture(c3ss) : void 0,
          mapping: 'uv'
        }
      }
		}
	};

	return style;
};

Polygon.getTextures = c3ss => {
  if (checkPolPatternSym(c3ss)) {
    let texture = getTextureFile(c3ss);
    let tex = {};

    if (texture) {
      tex[MD5(texture)] = {url: texture};
    }

    return tex;
  }
};
