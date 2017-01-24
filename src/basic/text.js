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

/*
  INTERNAL DEPENDENCIES
*/

import { getPropertyFnSafe, getPropertyOrDefFn, getColorFn } from './reference-helpers';
import TangramReference from '../utils/reference';

const TR = TangramReference.getText(null);

/*
  INTERNAL POLYGONS FUNCTIONS
*/

const checkTextSym = TangramReference.checkSymbolizer('text');

const getTextName = getPropertyFnSafe('name', TR);

const getSize = getPropertyFnSafe('size', TR);

const getColor = getColorFn(
  getPropertyFnSafe('fill', TR),
  getPropertyOrDefFn('opacity', TR)
);

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
        optional: false
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
