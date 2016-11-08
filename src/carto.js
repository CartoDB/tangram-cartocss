import Carto from 'carto';

const SYMBOLYZERS = {
  marker: 'points',
  polygon: 'polygons',
  line: 'lines'
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

const getSymbolizers = function (layer) {
  let draw = {};
  for (var i = 0; i < layer.symbolizers.length; i++) {
			let sym = layer.symbolizers[i];
			draw[translateSymName(sym)] = {
					color: getAttributeFeature(sym, 'fill', layer),
					size: getAttributeFeature(sym, 'size', layer),
					width: getAttributeFeature(sym, 'width', layer)
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
