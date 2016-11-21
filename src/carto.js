import Carto from 'carto';

const SYMBOLYZERS = {
  marker: 'points',
  polygon: 'polygons',
  line: 'lines'
};

const TYPES = {
  polygon: {
    color: 'fill',
    opacity: 'opacity'
  },

  line: {
    color: 'color'
  },

  marker: {
    color: 'color'
  },

  'polygon-pattern': { // NOTE: this is wrong, check it!
    color: 'type'
  }
};

const CCSS = new Carto.RendererJS();

const translateSymName = function (symName) {
  return SYMBOLYZERS[symName];
};

const getAttributeName = function (sym, feature) {
  return sym + '-' + feature;
};

const addFunction = function (innerCode) {
  return `function () {
    var _value = null;
    ${innerCode}
    return _value;
  }`;
};

const makeTangramCond = function (cond) {
  return cond
    .replace(/ctx.zoom/g, '$zoom')
    .replace(/data\[/g, 'feature[');
};

const stringFunction = function (fn, def, ...args) {
  if (!fn) return function () {return def;};

  fn = `return (${fn}());`;

  return new Function(...args, fn);
};

const getPropertyName = function (prop, type) {
  return TYPES[prop][type];
};

const getAttributeFeature = function (sym, feature, ly) {
  let attr = ly[getAttributeName(sym, feature)];
  if (!attr) return '';

  let js = attr.js,
      fnBody = '';

  for (var i = 0; i < js.length; i++) {
			fnBody += makeTangramCond(js[i]);
  }

  return addFunction(fnBody);
};

const getAlphaColor = function (color, opacity) {

  if (color && opacity) {

    var fn = `
    function () {
      var isHex = function (c) {
        return c.indexOf('#') >= 0;
      };
      var isRGB = function (c) {
        return c.indexOf('rgb') >= 0;
      };
      var isRGBA = function (c) {
        return c.indexOf('rgba') >= 0;
      };
      var toSix = function (c) {
        if (c.length === 7) {
          return c;
        }
        else {
          var r = c[1],
              g = c[2],
              b = c[3];

          return '#' + r + r + g + g + b + b;
        }
      };
      var hex2int = function (hex) {
        return parseInt('0x' + hex);
      };
      var toRGB = function (c) {
        var r = hex2int(c.substr(1, 2)) + ', ',
            g = hex2int(c.substr(3, 2)) + ', ',
            b = hex2int(c.substr(5, 2));
        return 'rgb(' + r + g + b + ')';
      };
      var toRGBA = function (rgb, alpha) {
        return rgb.replace('rgb', 'rgba').replace(')', ', ' + alpha + ')');
      };
      var color = (${color}());
      var opacity = (${opacity}()) || 1;

      if (isRGBA(color)) {
        return color;
      }
      else {
        if (isHex(color)) {
          return toRGBA(toRGB(toSix(color)), opacity);
        }
        else if (isRGB(color)){
          return toRGBA(color);
        }
      }
    }
    `;

    return fn;
  }

  return color;
};

const getSymbolizers = function (layer) {
  let draw = {};
  for (var i = 0; i < layer.symbolizers.length; i++) {
			let sym = layer.symbolizers[i];
			draw[translateSymName(sym)] = {
					color: getAlphaColor(getAttributeFeature(sym, getPropertyName(sym, 'color'), layer), getAttributeFeature(sym, getPropertyName(sym, 'opacity'), layer)),
					size: getAttributeFeature(sym, 'size', layer),
					width: stringFunction(getAttributeFeature(sym, 'width', layer), '', 'feature', '$zoom')({}, 10) + 'px'
			};
  }

  return draw;
};

const extractFeatures = function (ccss) {
  let layers = CCSS.render(ccss).getLayers(),
      draws = {};

  // NOTE: this is wrong, we have to separate the layers.
  for (var i = 0; i < layers.length; i++) {
			let ly = layers[i].shader;

			draws = getSymbolizers(ly);
  }

  return draws;
};

var C2Y;

export default C2Y = {
  extractFeatures
};
