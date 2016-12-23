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
// import MD5 from 'md5'; // NOTE: used when we support textures.

/*
	INTERNAL DEPENDENCIES
 */

import ReferenceHelper from './reference-helpers';
import Utils from '../utils/utils';
import TangramReference from '../utils/reference';
import Colors from '../style/colors';

const PR = TangramReference.getPolygon(); // Polygon reference

/*
	INTERNAL POLYGONS FUNCTIONS
 */

/**
 * function tha returns the alpha from a polygon
 *
 * @param   {object} c3ss compiled carto css
 * @returns {function} function that returns an alpha value
 */
const getPolygonAlpha = function(c3ss) {
	let alpha = c3ss[PR['fill-opacity'].css] || ReferenceHelper.defaultAlpha(PR, 'polygon'); // NOTE: improve the way of getting this. (functional)

	if (alpha) {
		return Utils.buildCCSSFn(alpha.js).toString();
	}
};

/**
 * Function to get the compiled carto css for the color property
 *
 * @param   {object} c3ss compiled carto css
 * @returns {object} with the compiled carto css for the color property
 */
const getPolygonColor = function(c3ss) {
	return c3ss[PR.fill.css] || ReferenceHelper.defaultColor(PR, 'polygon');
};

/**
 * Function for getting the color in rgba
 *
 * @param   {object} c3ss compiled carto css
 * @returns {object} with a function that contain the conditions to return a color with alpha channel
 */
const getColor = function (c3ss) {
	const alpha = getPolygonAlpha(c3ss);
	const color = getPolygonColor(c3ss);

	return {
		color: Colors.getAlphaColor(
				Utils.buildCCSSFn(color.js),
				alpha
			)
	};
};


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
Polygon.getDraw = function(c3ss) {
	let polygon = {};

	if (TangramReference.checkSymbolizer(c3ss, 'polygon')) {
		Object.assign(
				polygon,
				getColor(c3ss)
			);

	}

	return { polygons_blend: polygon };
};


/**
 * Function to get the style configuration of a polygon.
 *
 * @returns default style configuration for polygon
 */
Polygon.getStyle = function() {
	let style = {
		polygons_blend: {
			base: 'polygons',
			blend: 'overlay'
		}
	};

	// NOTE: this no makes sense actually. It will necessary in the future.
	// if (TangramReference.checkSymbolizer(c3ss, 'polygons')) {
	// 	Object.assign(
	// 			style.polygons_blend
	// 		);
	// };

	return style;
};
