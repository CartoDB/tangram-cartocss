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

import {curry, compose, not, equals, identity, cond} from 'ramda';

/*
  INTERNAL DEPENDENCIES
 */

import { getExecutedFn, getPropertyOrDefFn, getBlendFn, getColorFn } from '../utils/reference-helpers';
import TangramReference from '../utils/reference';
import Geom from '../utils/geom';

const notEq = curry(compose(not, equals));

const LR = TangramReference.getLine(null); // Line reference
/*
  INTERNAL LINE FUNCTIONS
 */

const checkLineSym = TangramReference.checkSymbolizer('line');

/**
 * Function for getting the color in rgba
 *
 * @param   {object} c3ss compiled carto css
 * @returns {object} with a function that contain the conditions to return a color with alpha channel
 */

const getColor = getColorFn(
  getPropertyOrDefFn('stroke', LR),
  getPropertyOrDefFn('stroke-opacity', LR)
);

/**
 * Function for getting the width in meters dynamically by zoom
 *
 * @param   {object} c3ss compiled carto css
 * @returns {object} witha a function with the conditions to return width value
 */

const getWidth = compose(
  Geom.px2Meters,
  getPropertyOrDefFn('stroke-width', LR)
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
const getBlending = getBlendFn(LR);

/**
 * Function for getting dash value statically
 *
 * @param   {object} c3ss compiled carto css
 * @returns {string} with dash value Ex: [2, 1]
 */

const getDashed = compose(
  cond([
    [notEq('none'), identity]
  ]),
  getExecutedFn('stroke-dasharray', LR)
);

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

Line.getDraw = (c3ss, id) => {
  let draw = {};
  if (checkLineSym(c3ss)) {
    draw['lines_' + id] = {
      color: getColor(c3ss),
      width: getWidth(c3ss),
      cap: getCap(c3ss),
      join: getJoin(c3ss)
    };
  }

  return draw;
};

/**
 * Function to get the style configuration of a line.
 *
 * @returns default style configuration for lines
 */
Line.getStyle = function (c3ss, id, ord) {
  let style = {};

  if (checkLineSym(c3ss)) {
    style['lines_' + id] = {
      base: 'lines',
      blend: getBlending(c3ss),
      dash: getDashed(c3ss),
      blend_order: typeof ord === 'number' ? ord + 1 : 1
    };
  }

  return style;
};
