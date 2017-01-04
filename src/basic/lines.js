/*
	 ___       ___  ________   _______   ________
	|\  \     |\  \|\   ___  \|\  ___ \ |\   ____\
	\ \  \    \ \  \ \  \\ \  \ \   __/|\ \  \___|_
	 \ \  \    \ \  \ \  \\ \  \ \  \_|/_\ \_____  \
	  \ \  \____\ \  \ \  \\ \  \ \  \_|\ \|____|\  \
	   \ \_______\ \__\ \__\\ \__\ \_______\____\_\  \
	    \|_______|\|__|\|__| \|__|\|_______|\_________\
	                                       \|_________|

 */

/*
	EXTERNAL DEPENDENCIES
 */

import R from 'ramda';

/*
	INTERNAL DEPENDENCIES
 */

import ReferenceHelper from './reference-helpers';
import Utils from '../utils/utils';
import TangramReference from '../utils/reference';
import Colors from '../style/colors';
import Geom from '../utils/geom';

const LR = TangramReference.getLine(); // Line reference
/*
	INTERNAL LINE FUNCTIONS
 */

const getExecutedFn = R.curry((prop, ref, c3ss) => R.compose(
  Utils.buildAndExecuteFn,
  R.prop('js'),
  ReferenceHelper.getPropOrDef
)(prop,ref,c3ss));

const getPropertyOrDefFn = R.curry((prop, ref, c3ss) => R.compose(
  Utils.buildCCSSFn,
  R.prop('js'),
  ReferenceHelper.getPropOrDef
)(prop,ref,c3ss));

const getPropertyFn = R.curry((prop, ref, c3ss) => R.compose(
  Utils.buildCCSSFn,
  R.prop('js'),
  ReferenceHelper.getProp
)(prop,ref,c3ss));

/**
 * Function to get the alpha channel of a line
 *
 * @param   {object} c3ss compiled carto css
 * @returns {function} function with the conditions to return alpha value
 */

const getAlpha = getPropertyOrDefFn('stroke-opacity', LR);

/**
 * Function to get the compiled carto css for the color property
 *
 * @param   {object} c3ss compiled carto css
 * @returns {object} with the compiled carto css for the color property
 */

const getBaseColor = getPropertyOrDefFn('stroke', LR);

/**
 * Function for getting the color in rgba
 *
 * @param   {object} c3ss compiled carto css
 * @returns {object} with a function that contain the conditions to return a color with alpha channel
 */

const getColor = function(c3ss) {
	const color = getBaseColor(c3ss);
	const alpha = getAlpha(c3ss);

	return Colors.getAlphaColor(color, alpha);
};

/**
 * Function for get the width in meters dynamically by zoom
 *
 * @param   {object} c3ss compiled carto css
 * @returns {object} witha a function with the conditions to return width value
 */

const getWidth = R.compose(
  Geom.px2Meters,
  getPropertyFn('stroke-width', LR)
);

const getCap = getExecutedFn('stroke-linecap', LR);

const getJoin = getExecutedFn('stroke-linejoin', LR);


/**
 * Basic Line
 */

var Line = {};

export default Line;

/**
 * Function to get the draw object of a line.
 *
 * @param   {object} c3ss compiled carto css
 * @returns {function} function with the conditions to return alpha value
 */

Line.getDraw = c3ss => {
  console.log(LR);
  return {
    lines_blend: {
      color: getColor(c3ss),
      width: getWidth(c3ss),
      cap: getCap(c3ss),
      join: getJoin(c3ss)
    }
  };
};

/**
 * Function to get the style configuration of a line.
 *
 * @returns default style configuration for lines
 */
Line.getStyle = function() {
	let style = {
		lines_blend: {
			base: 'lines',
			blend: 'overlay'
		}
	};

	// NOTE: this no makes sense actually.
	// if (TangramReference.checkSymbolizer(c3ss, 'polygons')) {
	// 	Object.assign(
	// 			style.polygons_blend
	// 		);
	// };

	return style;
};
