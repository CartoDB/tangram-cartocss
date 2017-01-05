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
import TangramReference from '../utils/reference';
import Colors from '../style/colors';
import Geom from '../utils/geom';

const LR = TangramReference.getLine(null); // Line reference
/*
	INTERNAL LINE FUNCTIONS
 */

const getExecutedFn = ReferenceHelper.getExecutedFn;

const getPropertyOrDefFn = ReferenceHelper.getPropertyOrDefFn;

const getPropertyFn = ReferenceHelper.getPropertyFn;

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
 * Function for getting the width in meters dynamically by zoom
 *
 * @param   {object} c3ss compiled carto css
 * @returns {object} witha a function with the conditions to return width value
 */

const getWidth = R.compose(
  Geom.px2Meters,
  getPropertyFn('stroke-width', LR)
);

/**
 * Function for getting the cap statically
 *
 * @param   {object} c3ss compiled carto css
 * @returns {string} with cap value Ex: round
 */
const getCap = getExecutedFn('stroke-linecap', LR);

/**
 * Function for getting the join statically
 *
 * @param   {object} c3ss compiled carto css
 * @returns {string} with join value Ex: round
 */
const getJoin = getExecutedFn('stroke-linejoin', LR);

/**
 * Function for getting the blend statically
 *
 * @param   {object} c3ss compiled carto css
 * @returns {string} with blending value Ex: "multiply"
 */
const getBlending = R.compose(
  R.defaultTo('overlay'),
  TangramReference.checkType(LR['comp-op']),
  getExecutedFn('comp-op', LR)
);

/**
 * Function for getting dash value statically
 *
 * @param   {object} c3ss compiled carto css
 * @returns {string} with dash value Ex: [2, 1]
 */
const getDashed = c3ss => {
  let val = getExecutedFn('stroke-dasharray', LR, c3ss);

  return val === 'none' ? undefined : val;
};

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
Line.getStyle = function(c3ss) {
	return {
		lines_blend: {
			base: 'lines',
			blend: getBlending(c3ss),
      dash: getDashed(c3ss)
		}
	};
};
