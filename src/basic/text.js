/**
   _________  _______      ___    ___ _________
  |\___   ___\\  ___ \    |\  \  /  /|\___   ___\
  \|___ \  \_\ \   __/|   \ \  \/  / ||___ \  \_|
      \ \  \ \ \  \_|/__  \ \    / /     \ \  \
        \ \  \ \ \  \_|\ \  /     \/       \ \  \
        \ \__\ \ \_______\/  /\   \        \ \__\
          \|__|  \|_______/__/ /\ __\        \|__|
                          |__|/ \|__|

 */

/*
  EXTERNAL DEPENDENCIES
*/

import R from 'ramda';

/*
  INTERNAL DEPENDENCIES
*/

import { getPropertyFnSafe, getPropertyOrDefFn } from './reference-helpers';
import TangramReference from '../utils/reference';
import Colors from '../style/colors';

const TR = TangramReference.getText(null);
// const arrPropFnSafe = R.compose(R.of, getPropertyFnSafe);

/*
  INTERNAL POLYGONS FUNCTIONS
*/

const checkTextSym = TangramReference.checkSymbolizer('text');

const getTextName = getPropertyFnSafe('name', TR);

const getSize = getPropertyFnSafe('size', TR);

const getFill = getPropertyFnSafe('fill', TR);

const getOpacity = getPropertyOrDefFn('opacity', TR);

const getColor = R.compose(
  R.apply(Colors.getAlphaColor),
  R.values,
  R.applySpec({
    color: getFill,
    opacity: getOpacity
  })
);

// const getBlend = getBlendFn(TR);

var TextPoint = {};

export default TextPoint;

TextPoint.getDraw = (c3ss, id) => {
  let draw = {};

  if (checkTextSym(c3ss)) {
    draw['text_' + id] = {
      collide: false,
      color: 'transparent',
      text: {
        text_source: getTextName(c3ss),
        font: {
          size: getSize(c3ss),
          fill: getColor(c3ss)
        },
        optional: true
      }
    };
  }

  return draw;
};


TextPoint.getStyle = (c3ss, id) => {
  let style = {};

  style['text_' + id] = {
    base: 'points',
    blend: 'overlay',
    blend_order: 4
  };

  return style;
};
