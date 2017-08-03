const TangramReference = require('../utils/reference');
const ramda = require('ramda');

const compose = ramda.compose;
const pickBy = ramda.pickBy;
const not = ramda.not;
const isNil = ramda.isNil;
const applySpec = ramda.applySpec;
const merge = ramda.merge;
const mergeWith = ramda.mergeWith;

/*
 * INTERNAL DEPENDENCIES
 */
const referenceHelpers = require('../utils/reference-helpers.js');
const getPropertyOrDefFn = referenceHelpers.getPropertyOrDefFn;
const getPropertyFnSafe = referenceHelpers.getPropertyFnSafe;
const getColorFn = referenceHelpers.getColorFn;

const DR = TangramReference.getDot(null); // Dot reference
const checkDotSym = TangramReference.checkSymbolizer('dot');

/**
 * get colors from cartocss with the alpha channel applied
 * @param  {object} c3ss compiled carto css
 * @return {object} draw object with color
 */

const getColor = getColorFn(
  getPropertyOrDefFn('fill', DR),
  getPropertyOrDefFn('opacity', DR)
);

const getColors = compose(
  pickBy(compose(not, isNil)),
  applySpec({
    color: getColor
  })
);

/**
 * getWidth for the dot
 * @param  {object} c3ss compiled carto css
 * @return {object} size
 */

const getDotWidth = getPropertyFnSafe('width', DR);

const getWidths = compose(
  pickBy(compose(not, isNil)),
  applySpec({
    size: getDotWidth
  })
);

/**
 * Basic Dot
 */

let Dots = {};

/**
 * Get the draw (for tangram) object of a dot from compiled carto css
 * @param  {object} c3ss compiled carto @class
 * @return {object} object with the draw types and their properties
 */

Dots.getDraw = function (c3ss, id) {
  let dot = {};
  let draw = {};

  if (checkDotSym(c3ss)) {
    dot = mergeWith(
      merge,
      getWidths(c3ss),
      getColors(c3ss)
    );

    draw['dots_' + id] = dot;
  }

  return draw;
};

/**
 * Function to get the style configuration of a dot.
 *
 * @returns default style configuration for dots
 */

Dots.getStyle = function (c3ss, id, ord) {
  let style = {};

  if (checkDotSym(c3ss)) {
    style['dots_' + id] = {
      base: 'points',
      blend: 'overlay',
      blend_order: ord || 1
    };
  }

  return style;
};

module.exports = Dots;
